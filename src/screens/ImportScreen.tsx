import { useRef, useState } from 'react';
import type { Account, Category, IncomeCategory, IncomeEntry, Receipt } from '../types';
import { looksLikeTransfer, parseBankCsv, type ParsedTransaction } from '../lib/csvImport';
import { isPdfFile } from '../lib/fileType';
import { categorize, categorizeIncome } from '../lib/categorize';
import { existingTransactionsFor, isLikelyDuplicate } from '../lib/derived';
import { formatDate, money } from '../lib/format';

type ImportRow = ParsedTransaction & {
  id: string;
  category: string;
  include: boolean;
  duplicate: boolean;
  transferLike: boolean;
};

const NEW_ACCOUNT = '__new__';

export function ImportScreen({
  receipts,
  categories,
  income,
  incomeCategories,
  accounts,
  onAccountsChange,
  onImport,
  onBack,
}: {
  receipts: Receipt[];
  categories: Category[];
  income: IncomeEntry[];
  incomeCategories: IncomeCategory[];
  accounts: Account[];
  onAccountsChange: (next: Account[]) => void;
  onImport: (newReceipts: Receipt[], newIncome: IncomeEntry[]) => void;
  onBack: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountKind, setNewAccountKind] = useState<'checking' | 'credit'>('credit');
  const [balanceInput, setBalanceInput] = useState('');

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? null;
  const isAddingAccount = accountId === NEW_ACCOUNT;

  function handleAccountSelect(id: string) {
    setAccountId(id);
    if (id !== NEW_ACCOUNT) {
      const acct = accounts.find((a) => a.id === id);
      setBalanceInput(acct && acct.kind === 'credit' && acct.balance !== 0 ? String(acct.balance) : '');
    }
  }

  function applyParsed(parsed: ParsedTransaction[], notFoundMessage: string) {
    if (parsed.length === 0) {
      setError(notFoundMessage);
      setRows(null);
      return;
    }
    const existing = existingTransactionsFor(receipts, income);
    const nextRows: ImportRow[] = parsed.map((t, i) => {
      const duplicate = isLikelyDuplicate(t, existing);
      const transferLike = looksLikeTransfer(t.description);
      const category =
        t.direction === 'out' ? categorize(t.description, '', categories) : categorizeIncome(t.description, incomeCategories);
      return { ...t, id: `${i}-${t.date}-${t.amount}`, category, include: !duplicate && !transferLike, duplicate, transferLike };
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

    let targetAccountId = accountId;
    let nextAccounts = accounts;

    if (isAddingAccount) {
      const trimmed = newAccountName.trim();
      if (!trimmed) return;
      const newAccount: Account = {
        id: crypto.randomUUID(),
        name: trimmed,
        kind: newAccountKind,
        balance: newAccountKind === 'credit' ? parseFloat(balanceInput.replace(/[^0-9.]/g, '')) || 0 : 0,
      };
      nextAccounts = [...accounts, newAccount];
      targetAccountId = newAccount.id;
    } else if (selectedAccount?.kind === 'credit') {
      const newBalance = parseFloat(balanceInput.replace(/[^0-9.]/g, '')) || 0;
      if (newBalance !== selectedAccount.balance) {
        nextAccounts = accounts.map((a) => (a.id === selectedAccount.id ? { ...a, balance: newBalance } : a));
      }
    }

    if (nextAccounts !== accounts) onAccountsChange(nextAccounts);

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
        accountId: targetAccountId,
      }));
    const newIncome: IncomeEntry[] = included
      .filter((r) => r.direction === 'in')
      .map((r) => ({
        id: crypto.randomUUID(),
        source: r.description,
        date: r.date,
        amount: r.amount,
        category: r.category,
        accountId: targetAccountId,
      }));
    onImport(newReceipts, newIncome);
  }

  const includedCount = rows?.filter((r) => r.include).length ?? 0;
  const canImport = includedCount > 0 && (!isAddingAccount || newAccountName.trim().length > 0);

  return (
    <div className="screen import-screen">
      <button className="link-btn back-link" onClick={onBack}>
        ← Scan
      </button>
      <div className="eyebrow">Import bank transactions</div>
      <p className="review-sub">
        Export a CSV from your bank or credit card (usually under "Download transactions") and upload it here.
        Nothing is saved until you review it below.
      </p>

      <div className="account-select-row">
        <label className="account-select-label">Which account is this for?</label>
        <select className="text-input" value={accountId} onChange={(e) => handleAccountSelect(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.kind === 'credit' ? 'Credit card' : 'Checking / cash'})
            </option>
          ))}
          <option value={NEW_ACCOUNT}>+ Add a new account…</option>
        </select>

        {isAddingAccount && (
          <div className="new-account-row">
            <input
              className="text-input"
              style={{ flex: 1 }}
              placeholder="e.g. Visa"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
            />
            <select
              className="text-input"
              value={newAccountKind}
              onChange={(e) => setNewAccountKind(e.target.value as 'checking' | 'credit')}
            >
              <option value="credit">Credit card</option>
              <option value="checking">Checking / cash</option>
            </select>
          </div>
        )}

        {(isAddingAccount ? newAccountKind === 'credit' : selectedAccount?.kind === 'credit') && (
          <div className="new-account-row">
            <label className="account-select-label" style={{ flex: 'none' }}>
              Current balance owed (from this statement)
            </label>
            <input
              className="text-input mono"
              style={{ width: 110 }}
              inputMode="decimal"
              placeholder="0.00"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </div>
        )}

        {(isAddingAccount ? newAccountKind === 'credit' : selectedAccount?.kind === 'credit') && (
          <p className="review-sub" style={{ margin: 0 }}>
            Credit card exports don't all use the same sign for charges vs. payments — check the +/− on each row
            below rather than trusting it automatically.
          </p>
        )}
      </div>

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
                      {row.duplicate && (
                        <span className="owed-badge" title="Same amount and direction within 3 days of an existing entry">
                          Possible duplicate
                        </span>
                      )}
                      {!row.duplicate && row.transferLike && (
                        <span className="owed-badge" title="Looks like a payment/transfer between your own accounts">
                          Looks like a payment
                        </span>
                      )}
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

          <button className="btn btn-accent" style={{ width: '100%', marginTop: 16 }} onClick={handleImport} disabled={!canImport}>
            Import {includedCount} transaction{includedCount === 1 ? '' : 's'}
            {(isAddingAccount ? newAccountKind === 'credit' : selectedAccount?.kind === 'credit') && balanceInput
              ? ` · balance ${money(parseFloat(balanceInput) || 0)}`
              : ''}
          </button>
        </>
      )}
    </div>
  );
}
