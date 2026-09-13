import { useState } from 'react';
import type { IncomeCategory, IncomeEntry } from '../types';
import { currentMonthKey, incomeTotalInMonth } from '../lib/derived';
import { addIncomeCategory } from '../lib/incomeCategories';
import { money, formatDate } from '../lib/format';
import { CategoryPill } from '../components/CategoryPill';

export function IncomeScreen({
  income,
  incomeCategories,
  onAdd,
  onDelete,
  onCategoriesChange,
  onBack,
}: {
  income: IncomeEntry[];
  incomeCategories: IncomeCategory[];
  onAdd: (entry: { source: string; date: string; amount: number; category: string }) => void;
  onDelete: (id: string) => void;
  onCategoriesChange: (next: IncomeCategory[]) => void;
  onBack: () => void;
}) {
  const monthKey = currentMonthKey();
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(incomeCategories[0]?.name ?? 'Other');
  const [newCat, setNewCat] = useState('');

  const total = incomeTotalInMonth(income, monthKey);
  const sorted = [...income].sort((a, b) => b.date.localeCompare(a.date));

  function handleAdd() {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!parsed || parsed <= 0) return;
    onAdd({ source: source.trim() || 'Income', date, amount: parsed, category });
    setSource('');
    setAmount('');
  }

  function handleAddCategory() {
    const { categories: next, name } = addIncomeCategory(incomeCategories, newCat);
    onCategoriesChange(next);
    setNewCat('');
    if (name) setCategory(name);
  }

  function removeCategory(name: string) {
    if (incomeCategories.length <= 1) return;
    onCategoriesChange(incomeCategories.filter((c) => c.name !== name));
    if (category === name) setCategory(incomeCategories.find((c) => c.name !== name)?.name ?? 'Other');
  }

  return (
    <div className="screen income-screen">
      <button className="link-btn back-link" onClick={onBack}>
        ← Scan
      </button>
      <div className="eyebrow">{new Date().toLocaleDateString('en-US', { month: 'long' })} income</div>
      <div className="big-total mono">{money(total)}</div>

      <div className="income-add-card">
        <div className="income-add-row">
          <input
            className="text-input"
            style={{ flex: 1 }}
            placeholder="Source (e.g. Paycheck)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <input
            className="text-input income-amount-input mono"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          />
        </div>
        <div className="income-add-row">
          <input className="text-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="chip-row" style={{ marginTop: 10 }}>
          {incomeCategories.map((c) => (
            <CategoryPill key={c.name} category={c} size="chip" selected={c.name === category} onClick={() => setCategory(c.name)} />
          ))}
        </div>
        <button className="btn btn-accent" style={{ marginTop: 12, width: '100%' }} onClick={handleAdd}>
          Add income
        </button>
      </div>

      <div className="eyebrow" style={{ margin: '26px 0 12px' }}>
        All income
      </div>
      {sorted.length === 0 ? (
        <p className="empty-state">Nothing logged yet.</p>
      ) : (
        <div className="receipt-list">
          {sorted.map((i) => {
            const cat = incomeCategories.find((c) => c.name === i.category) ?? { name: i.category, hue: null };
            return (
              <div className="receipt-row income-row" key={i.id}>
                <span className="dot" style={{ background: cat.hue == null ? 'oklch(0.45 0.012 85)' : `oklch(0.43 0.095 ${cat.hue})` }} />
                <span className="receipt-row-mid">
                  <span className="receipt-row-merchant">{i.source}</span>
                  <span className="receipt-row-meta">
                    {formatDate(i.date)} · {i.category}
                  </span>
                </span>
                <span className="receipt-row-total mono">{money(i.amount)}</span>
                <button className="item-remove" onClick={() => onDelete(i.id)} aria-label="Delete income entry">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="add-category">
        <div className="add-category-heading">Income categories</div>
        <div className="add-category-row">
          <input
            className="text-input"
            placeholder="e.g. Rental income"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCategory();
            }}
          />
          <button className="btn btn-accent" onClick={handleAddCategory}>
            Add
          </button>
        </div>
        <div className="chip-row" style={{ marginTop: 14 }}>
          {incomeCategories.map((c) => (
            <CategoryPill key={c.name} category={c} size="chip">
              {incomeCategories.length > 1 && (
                <button
                  className="pill-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCategory(c.name);
                  }}
                  aria-label={`Remove ${c.name}`}
                >
                  ✕
                </button>
              )}
            </CategoryPill>
          ))}
        </div>
      </div>
    </div>
  );
}
