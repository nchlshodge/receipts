import { useRef, useState } from 'react';
import type { Category, IncomeCategory, IncomeEntry, Receipt } from '../types';
import { parseBankCsv, type ParsedTransaction } from '../lib/csvImport';
import { isPdfFile } from '../lib/fileType';
import { categorize, categorizeIncome } from '../lib/categorize';
import { receiptTotal } from '../lib/derived';
import { formatDate } from '../lib/format';

type ImportRow = ParsedTransaction & {
  id: string;
  category: string;
  include: boolean;
  duplicate: boolean;
};

function buildExistingSignatures(receipts: Receipt[], income: IncomeEntry[]): Set<string> {
  const sigs = new Set<string>();
  for (const r of receipts) {
    sigs.add(`out|${r.date}|${Math.round(receiptTotal(r) * 100)}|${r.merchant.toLowerCase().trim()}`);
  }
  for (const i of income) {
    sigs.add(`in|${i.date}|${Math.round(i.amount * 100)}|${i.source.toLowerCase().trim()}`);
  }
  return sigs;
}

export function ImportScreen({
  receipts,
  categories,
  income,
  incomeCategories,
  onImport,
  onBack,
}: {
  receipts: Receipt[];
  categories: Category[];
  income: IncomeEntry[];
  incomeCategories: IncomeCategory[];
  onImport: (newReceipts: Receipt[], newIncome: IncomeEntry[]) => void;
  onBack: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function applyParsed(parsed: ParsedTransaction[], notFoundMessage: string) {
    if (parsed.length === 0) {
      setError(notFoundMessage);
      setRows(null);
      return;
    }
    const existing = buildExistingSignatures(receipts, income);
    const nextRows: ImportRow[] = parsed.map((t, i) => {
      const sig = `${t.direction}|${t.date}|${Math.round(t.amount * 100)}|${t.description.toLowerCase().trim()}`;
      const duplicate = existing.has(sig);
      const category =
        t.direction === 'out' ? categorize(t.description, '', categories) : categorizeIncome(t.description, incomeCategories);
      return { ...t, id: `${i}-${t.date}-${t.amount}`, category, include: !duplicate, duplicate };
    });
    setRows(nextRows);
  }

  async function handleFile(file: File) {
    setError('');
    setRows(null);
    setLoading(true);
    try {
      if (isPdfFile(file)) {
        const { extractPdfText, parseStatementText } = await import('../lib/pdf');
        const text = await extractPdfText(file);
        const parsed = parseStatementText(text);
        applyParsed(
          parsed,
          "Couldn't find transaction lines in that PDF — statement layouts vary a lot, so try the CSV export from your bank instead if this doesn't work.",
        );
      } else {
        const text = await file.text();
        const parsed = parseBankCsv(text);
        applyParsed(parsed, "Couldn't find recognizable date/description/amount columns in that file.");
      }
    } catch (err) {
      console.error('Import parse failed', err);
      setError("Couldn't read that file.");
    } finally {
      setLoading(false);
    }
  }

  function updateRow(id: string, patch: Partial<ImportRow>) {
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev));
  }

  function handleImport() {
    if (!rows) return;
    const included = rows.filter((r) => r.include);
    const newReceipts: Receipt[] = included
      .filter((r) => r.direction === 'out')
      .map((r) => ({
        id: crypto.randomUUID(),
        merchant: r.description,
        date: r.date,
        items: [{ name: r.description, price: r.amount, category: r.category }],
        photoId: null,
        owed: false,
        repaid: false,
        accountId: 'default',
      }));
    const newIncome: IncomeEntry[] = included
      .filter((r) => r.direction === 'in')
      .map((r) => ({
        id: crypto.randomUUID(),
        source: r.description,
        date: r.date,
        amount: r.amount,
        category: r.category,
        accountId: 'default',
      }));
    onImport(newReceipts, newIncome);
  }

  const includedCount = rows?.filter((r) => r.include).length ?? 0;

  return (
    <div className="screen import-screen">
      <button className="link-btn back-link" onClick={onBack}>
        ← Scan
      </button>
      <div className="eyebrow">Import bank transactions</div>
      <p className="review-sub">
        Export a CSV from your bank (usually under "Download transactions") and upload it here. Nothing is saved
        until you review it below.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv,.pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <button className="btn btn-accent" onClick={() => fileRef.current?.click()} disabled={loading}>
        {loading ? 'Reading file…' : 'Choose CSV or PDF file'}
      </button>

      {error && <p className="empty-state" style={{ textAlign: 'left', color: 'var(--over-text)' }}>{error}</p>}

      {rows && (
        <p className="review-sub" style={{ margin: '16px 0 0' }}>
          PDF statements are less consistent than CSV exports — double-check the amounts and whether each row is
          money in or out below.
        </p>
      )}

      {rows && (
        <>
          <div className="import-rows">
            {rows.map((row) => {
              const catOptions = row.direction === 'out' ? categories : incomeCategories;
              return (
                <div className={`import-row ${row.include ? '' : 'import-row-excluded'}`} key={row.id}>
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                  />
                  <div className="import-row-mid">
                    <div className="import-row-top">
                      <input
                        className="import-row-desc-input"
                        value={row.description}
                        onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      />
                      <button
                        className="direction-flip"
                        style={row.direction === 'in' ? { color: 'var(--link)', borderColor: 'var(--link)' } : undefined}
                        title="Toggle money in / out"
                        onClick={() => {
                          const nextDirection = row.direction === 'in' ? 'out' : 'in';
                          const nextCats = nextDirection === 'out' ? categories : incomeCategories;
                          updateRow(row.id, {
                            direction: nextDirection,
                            category: nextCats.find((c) => c.name === row.category)?.name ?? nextCats[0]?.name ?? 'Other',
                          });
                        }}
                      >
                        {row.direction === 'in' ? '+' : '−'}
                      </button>
                      <input
                        className="import-row-amount-input mono"
                        inputMode="decimal"
                        value={row.amount === 0 ? '' : String(row.amount)}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9.]/g, '');
                          updateRow(row.id, { amount: v ? parseFloat(v) : 0 });
                        }}
                      />
                    </div>
                    <div className="import-row-bottom">
                      <span className="receipt-row-meta">{formatDate(row.date)}</span>
                      {row.duplicate && <span className="owed-badge">Already imported</span>}
                      <select
                        className="text-input import-category-select"
                        value={row.category}
                        onChange={(e) => updateRow(row.id, { category: e.target.value })}
                      >
                        {catOptions.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn btn-accent" style={{ width: '100%', marginTop: 16 }} onClick={handleImport} disabled={includedCount === 0}>
            Import {includedCount} transaction{includedCount === 1 ? '' : 's'}
          </button>
        </>
      )}
    </div>
  );
}
