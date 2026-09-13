import type { Category, Receipt } from '../types';
import { filterReceipts } from '../lib/derived';
import { CategoryPill } from '../components/CategoryPill';
import { ReceiptRow } from '../components/ReceiptRow';

export function SearchScreen({
  receipts,
  categories,
  query,
  filter,
  onQueryChange,
  onFilterChange,
  onOpenReceipt,
  onDone,
}: {
  receipts: Receipt[];
  categories: Category[];
  query: string;
  filter: string | null;
  onQueryChange: (q: string) => void;
  onFilterChange: (f: string | null) => void;
  onOpenReceipt: (id: string) => void;
  onDone: () => void;
}) {
  const results = filterReceipts(receipts, query, filter);

  return (
    <div className="screen search-screen">
      <div className="search-top-row">
        <input
          className="text-input"
          style={{ flex: 1 }}
          placeholder="Merchant or item"
          value={query}
          autoFocus
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <button className="link-btn" onClick={onDone}>
          Done
        </button>
      </div>

      <div className="chip-row" style={{ marginBottom: 22 }}>
        <button
          className="pill all-pill"
          style={{
            borderColor: !filter ? 'oklch(0.3 0.012 85)' : 'oklch(0.89 0.012 85)',
          }}
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

      {results.length === 0 ? (
        <p className="empty-state">Nothing here matches that.</p>
      ) : (
        <div className="receipt-list">
          {results.map((r) => (
            <ReceiptRow key={r.id} receipt={r} categories={categories} onClick={() => onOpenReceipt(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
