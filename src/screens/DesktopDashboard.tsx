import { useRef } from 'react';
import type { Category, IncomeEntry, Receipt } from '../types';
import {
  IMPORT_REMINDER_DAYS,
  currentMonthKey,
  daysSinceImport,
  filterReceipts,
  incomeTotalInMonth,
  totalBudget,
  totalSpendInMonth,
} from '../lib/derived';
import { money } from '../lib/format';
import { BudgetList } from '../components/BudgetList';
import { CategoryPill } from '../components/CategoryPill';
import { ReceiptRow } from '../components/ReceiptRow';

export function DesktopDashboard({
  categories,
  receipts,
  income,
  query,
  filter,
  onCategoriesChange,
  onQueryChange,
  onFilterChange,
  onOpenReceipt,
  onFile,
  onManualEntry,
  onOpenIncome,
  onOpenImport,
  lastImportAt,
}: {
  categories: Category[];
  receipts: Receipt[];
  income: IncomeEntry[];
  query: string;
  filter: string | null;
  onCategoriesChange: (next: Category[]) => void;
  onQueryChange: (q: string) => void;
  onFilterChange: (f: string | null) => void;
  onOpenReceipt: (id: string) => void;
  onFile: (file: File) => void;
  onManualEntry: () => void;
  onOpenIncome: () => void;
  onOpenImport: () => void;
  lastImportAt: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const monthKey = currentMonthKey();
  const spend = totalSpendInMonth(receipts, monthKey);
  const budget = totalBudget(categories);
  const remaining = budget - spend;
  const isOver = spend > budget && budget > 0;
  const monthIncome = incomeTotalInMonth(income, monthKey);
  const unallocated = monthIncome - budget;
  const results = filterReceipts(receipts, query, filter);
  const daysSince = daysSinceImport(lastImportAt);
  const showImportReminder = daysSince === null || daysSince >= IMPORT_REMINDER_DAYS;

  return (
    <div className="desktop-shell">
      <div className="desktop-card">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />
        <div className="desktop-header">
          <div>
            <div className="eyebrow">{new Date().toLocaleDateString('en-US', { month: 'long' })} spending</div>
            <div className="desktop-total mono">{money(spend)}</div>
            <div className="sub-line">
              {isOver ? `${money(spend - budget)} over budget` : `${money(remaining)} left this month`} · budget{' '}
              {money(budget)}
            </div>
            {monthIncome > 0 && (
              <div className="sub-line">
                Income {money(monthIncome)} ·{' '}
                {unallocated >= 0 ? `${money(unallocated)} unallocated` : `${money(-unallocated)} over income`}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <button className="btn btn-accent desktop-cta" onClick={() => fileRef.current?.click()}>
              Scan a receipt
            </button>
            <button className="link-btn" onClick={onManualEntry} style={{ padding: '2px 0' }}>
              No receipt? Log it manually
            </button>
            <button className="link-btn" onClick={onOpenIncome} style={{ padding: '2px 0' }}>
              Log income
            </button>
            <button className="link-btn" onClick={onOpenImport} style={{ padding: '2px 0' }}>
              Import bank CSV
            </button>
          </div>
        </div>

        {showImportReminder && (
          <button className="import-reminder" onClick={onOpenImport}>
            {daysSince === null
              ? 'Import your bank transactions to get started →'
              : `It's been ${daysSince} day${daysSince === 1 ? '' : 's'} since your last import →`}
          </button>
        )}

        <div className="desktop-grid">
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Budget vs. actual
            </div>
            <BudgetList
              categories={categories}
              receipts={receipts}
              income={income}
              onCategoriesChange={onCategoriesChange}
              showSummary={false}
            />
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Receipts
            </div>
            <div className="chip-row" style={{ marginBottom: 16 }}>
              <button
                className="pill all-pill"
                style={{ borderColor: !filter ? 'oklch(0.3 0.012 85)' : 'oklch(0.89 0.012 85)' }}
                onClick={() => onFilterChange(null)}
              >
                All
              </button>
              {categories.map((c) => (
                <CategoryPill
                  key={c.name}
                  category={c}
                  size="md"
                  selected={c.name === filter}
                  onClick={() => onFilterChange(filter === c.name ? null : c.name)}
                  style={{ opacity: filter && filter !== c.name ? 0.45 : 1 }}
                />
              ))}
            </div>
            <input
              className="text-input"
              style={{ marginBottom: 16, width: '100%' }}
              placeholder="Search merchant or item"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
            {results.length === 0 ? (
              <p className="empty-state" style={{ textAlign: 'left' }}>
                Nothing here matches that filter.
              </p>
            ) : (
              <div className="receipt-list">
                {results.map((r) => (
                  <ReceiptRow key={r.id} receipt={r} categories={categories} onClick={() => onOpenReceipt(r.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
