import { useState } from 'react';
import type { Category, IncomeEntry, Receipt } from '../types';
import {
  currentMonthKey,
  incomeTotalInMonth,
  sortedCategoryRowsForMonth,
  suggestedBudget,
  totalBudget,
  totalSpendInMonth,
} from '../lib/derived';
import { addCategory } from '../lib/categories';
import { money } from '../lib/format';

export function BudgetList({
  categories,
  receipts,
  income,
  onCategoriesChange,
  showSummary = true,
}: {
  categories: Category[];
  receipts: Receipt[];
  income: IncomeEntry[];
  onCategoriesChange: (next: Category[]) => void;
  showSummary?: boolean;
}) {
  const [newCat, setNewCat] = useState('');
  const monthKey = currentMonthKey();
  const rows = sortedCategoryRowsForMonth(categories, receipts, monthKey);
  const spent = totalSpendInMonth(receipts, monthKey);
  const budget = totalBudget(categories);
  const remaining = budget - spent;
  const overallPct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const isOver = spent > budget && budget > 0;
  const monthIncome = incomeTotalInMonth(income, monthKey);
  const unallocated = monthIncome - budget;

  const suggestions = new Map(
    categories.map((c) => [c.name, suggestedBudget(receipts, c.name, monthKey)] as const),
  );
  const hasAnySuggestion = [...suggestions.values()].some((v) => v !== null);

  function setBudget(name: string, value: number) {
    onCategoriesChange(categories.map((c) => (c.name === name ? { ...c, budget: value } : c)));
  }

  function applyAllSuggestions() {
    onCategoriesChange(
      categories.map((c) => {
        const suggestion = suggestions.get(c.name);
        return suggestion === null || suggestion === undefined ? c : { ...c, budget: suggestion };
      }),
    );
  }

  function handleAdd() {
    const { categories: next } = addCategory(categories, newCat);
    onCategoriesChange(next);
    setNewCat('');
  }

  function removeCategory(name: string) {
    if (categories.length <= 1) return;
    onCategoriesChange(categories.filter((c) => c.name !== name));
  }

  return (
    <div>
      {showSummary && (
        <>
          <div className="eyebrow">{new Date().toLocaleDateString('en-US', { month: 'long' })}</div>
          <div className="big-total mono">{money(spent)}</div>
          <div className="sub-line">
            {isOver ? `${money(spent - budget)} over budget` : `${money(remaining)} left this month`} · budget{' '}
            {money(budget)}
          </div>
          {monthIncome > 0 && (
            <div className="sub-line">
              Income {money(monthIncome)} ·{' '}
              {unallocated >= 0 ? `${money(unallocated)} unallocated` : `${money(-unallocated)} over income`}
            </div>
          )}
          <div className="bar-track" style={{ height: 8, marginBottom: 26 }}>
            <div
              className="bar-fill"
              style={{
                width: `${overallPct}%`,
                background: isOver ? 'var(--over)' : 'var(--accent)',
              }}
            />
          </div>
        </>
      )}

      {hasAnySuggestion && (
        <div className="suggest-row">
          <span>Suggestions are based on your last 2 months of spending.</span>
          <button className="link-btn" onClick={applyAllSuggestions}>
            Apply all suggestions
          </button>
        </div>
      )}

      <div className="category-rows">
        {rows.map((row) => {
          const over = row.budget > 0 && row.spent > row.budget;
          const pct = row.budget > 0 ? Math.min(100, Math.max(2, (row.spent / row.budget) * 100)) : 2;
          const suggestion = suggestions.get(row.name);
          const showSuggestion = suggestion !== null && suggestion !== undefined && suggestion !== row.budget;
          return (
            <div key={row.name} className="category-row">
              <div className="category-row-head">
                <span className="category-row-left">
                  <span
                    className="dot"
                    style={{ background: row.hue == null ? 'oklch(0.45 0.012 85)' : `oklch(0.43 0.095 ${row.hue})` }}
                  />
                  <span className="category-name">{row.name}</span>
                </span>
                <span className="category-row-right">
                  <span className={`mono ${over ? 'over-text' : ''}`}>{money(row.spent)}</span>
                  <span className="of-word">of</span>
                  <input
                    className="budget-input mono"
                    inputMode="numeric"
                    value={row.budget === 0 ? '' : String(row.budget)}
                    placeholder="0"
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '');
                      setBudget(row.name, digits ? parseInt(digits, 10) : 0);
                    }}
                  />
                  <button
                    className="pill-remove"
                    onClick={() => removeCategory(row.name)}
                    aria-label={`Remove ${row.name}`}
                    title={`Remove ${row.name}`}
                  >
                    ✕
                  </button>
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: over
                      ? 'var(--over)'
                      : row.hue == null
                        ? 'oklch(0.45 0.012 85 / 0.8)'
                        : `oklch(0.43 0.095 ${row.hue} / 0.8)`,
                  }}
                />
              </div>
              {showSuggestion && (
                <div className="suggestion-hint">
                  Last 2 months avg: {money(suggestion)}
                  <button className="link-btn" onClick={() => setBudget(row.name, suggestion)}>
                    Use this
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="add-category">
        <div className="add-category-heading">Add a category</div>
        <div className="add-category-sub">New ones show up right away when you're sorting a receipt.</div>
        <div className="add-category-row">
          <input
            className="text-input"
            placeholder="e.g. Nursery Supplies"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
          <button className="btn btn-accent" onClick={handleAdd}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
