import type { Category, Receipt, ReceiptItem } from '../types';
import { receiptTotal } from '../lib/derived';
import { getCategory } from '../lib/categories';
import { money } from '../lib/format';
import { CategoryPill } from './CategoryPill';

export function ReviewCard({
  draft,
  categories,
  onChange,
  onOpenSheet,
}: {
  draft: Receipt;
  categories: Category[];
  onChange: (next: Receipt) => void;
  onOpenSheet: (index: number) => void;
}) {
  function updateItem(index: number, patch: Partial<ReceiptItem>) {
    const items = draft.items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange({ ...draft, items });
  }

  function removeItem(index: number) {
    onChange({ ...draft, items: draft.items.filter((_, i) => i !== index) });
  }

  function addItem() {
    const other = categories.find((c) => c.name === 'Other')?.name ?? categories[0]?.name ?? 'Other';
    onChange({ ...draft, items: [...draft.items, { name: '', price: 0, category: other }] });
  }

  return (
    <div className="receipt-card">
      <div className="receipt-card-header">
        <input
          className="merchant-input"
          value={draft.merchant}
          placeholder="Merchant or description"
          onChange={(e) => onChange({ ...draft, merchant: e.target.value })}
        />
        <input
          className="date-input"
          type="date"
          value={draft.date}
          onChange={(e) => onChange({ ...draft, date: e.target.value })}
        />
      </div>

      {draft.items.map((item, i) => {
        const cat = getCategory(categories, item.category);
        return (
          <div className="item-row" key={i}>
            <CategoryPill category={cat} onClick={() => onOpenSheet(i)} />
            <input
              className="item-name-input"
              value={item.name}
              placeholder="Item"
              onChange={(e) => updateItem(i, { name: e.target.value })}
            />
            <input
              className="item-price-input mono"
              inputMode="decimal"
              value={item.price === 0 ? '' : String(item.price)}
              placeholder="0.00"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '');
                updateItem(i, { price: v ? parseFloat(v) : 0 });
              }}
            />
            <button className="item-remove" onClick={() => removeItem(i)} aria-label="Remove item">
              ✕
            </button>
          </div>
        );
      })}

      <button className="add-item-btn" onClick={addItem}>
        + Add item
      </button>

      <div className="total-row">
        <span className="total-label">Total</span>
        <span className="total-amount mono">{money(receiptTotal(draft))}</span>
      </div>

      <label className="owed-toggle">
        <input
          type="checkbox"
          checked={draft.owed}
          onChange={(e) => onChange({ ...draft, owed: e.target.checked, repaid: e.target.checked ? draft.repaid : false })}
        />
        I paid this myself — track it until I'm reimbursed
      </label>
    </div>
  );
}
