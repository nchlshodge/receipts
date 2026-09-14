import { useRef, useState } from 'react';
import type { Category, IncomeCategory, IncomeEntry, Receipt } from '../types';
import { parseBankCsv, type ParsedTransaction } from '../lib/csvImport';
import { categorize, categorizeIncome } from '../lib/categorize';
import { receiptTotal } from '../lib/derived';
import { formatDate, money } from '../lib/format';

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

  function handleFile(file: File) {
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const parsed = parseBankCsv(text);
      if (parsed.length === 0) {
        setError("Couldn't find recognizable date/description/amount columns in that file.");
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
    };
    reader.readAsText(file);
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
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <button className="btn btn-accent" onClick={() => fileRef.current?.click()}>
        Choose CSV file
      </button>

      {error && <p className="empty-state" style={{ textAlign: 'left', color: 'var(--over-text)' }}>{error}</p>}

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
                      <div className="import-row-desc">{row.description}</div>
                      <span className={`mono import-row-amount ${row.direction === 'in' ? 'income-amount' : ''}`}>
                        {row.direction === 'in' ? '+' : '−'}
                        {money(row.amount)}
                      </span>
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
