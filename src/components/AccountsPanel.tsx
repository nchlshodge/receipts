import { useState } from 'react';
import type { Account } from '../types';
import { money } from '../lib/format';

export function AccountsPanel({
  accounts,
  onAccountsChange,
}: {
  accounts: Account[];
  onAccountsChange: (next: Account[]) => void;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'checking' | 'credit'>('credit');

  const creditAccounts = accounts.filter((a) => a.kind === 'credit');
  const totalDebt = Math.round(creditAccounts.reduce((sum, a) => sum + a.balance, 0) * 100) / 100;

  function updateBalance(id: string, balance: number) {
    onAccountsChange(accounts.map((a) => (a.id === id ? { ...a, balance } : a)));
  }

  function addAccount() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAccountsChange([...accounts, { id: crypto.randomUUID(), name: trimmed, kind, balance: 0 }]);
    setName('');
  }

  function removeAccount(id: string) {
    if (accounts.length <= 1) return;
    onAccountsChange(accounts.filter((a) => a.id !== id));
  }

  return (
    <div className="accounts-panel">
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Accounts &amp; debt
      </div>

      {creditAccounts.length > 0 && (
        <div className="total-debt-line">
          <span>Total debt</span>
          <span className="mono over-text">{money(totalDebt)}</span>
        </div>
      )}

      <div className="account-rows">
        {accounts.map((a) => (
          <div className="account-row" key={a.id}>
            <div className="account-row-left">
              <span className="account-name">{a.name}</span>
              <span className="account-kind">{a.kind === 'credit' ? 'Credit card' : 'Checking / cash'}</span>
            </div>
            {a.kind === 'credit' ? (
              <input
                className="budget-input mono account-balance-input"
                inputMode="decimal"
                value={a.balance === 0 ? '' : String(a.balance)}
                placeholder="0"
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, '');
                  updateBalance(a.id, v ? parseFloat(v) : 0);
                }}
              />
            ) : (
              <span className="faint-note">—</span>
            )}
            {accounts.length > 1 && (
              <button className="pill-remove" onClick={() => removeAccount(a.id)} aria-label={`Remove ${a.name}`}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="add-account-row">
        <input
          className="text-input"
          style={{ flex: 1 }}
          placeholder="e.g. Visa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addAccount();
          }}
        />
        <select className="text-input" value={kind} onChange={(e) => setKind(e.target.value as 'checking' | 'credit')}>
          <option value="credit">Credit card</option>
          <option value="checking">Checking / cash</option>
        </select>
        <button className="btn btn-accent" onClick={addAccount}>
          Add
        </button>
      </div>
    </div>
  );
}
