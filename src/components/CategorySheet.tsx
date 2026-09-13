import { useState } from 'react';
import type { Category } from '../types';
import { addCategory } from '../lib/categories';
import { CategoryPill } from './CategoryPill';

export function CategorySheet({
  itemName,
  categories,
  currentCategory,
  onSelect,
  onCategoriesChange,
  onClose,
}: {
  itemName: string;
  categories: Category[];
  currentCategory: string;
  onSelect: (categoryName: string) => void;
  onCategoriesChange: (next: Category[]) => void;
  onClose: () => void;
}) {
  const [newCat, setNewCat] = useState('');

  function handleAddAndUse() {
    const { categories: next, name } = addCategory(categories, newCat);
    if (!name) return;
    onCategoriesChange(next);
    onSelect(name);
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">Where does &ldquo;{itemName}&rdquo; go?</div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {categories.map((c) => (
            <CategoryPill
              key={c.name}
              category={c}
              size="md"
              selected={c.name === currentCategory}
              onClick={() => onSelect(c.name)}
            />
          ))}
        </div>
        <div className="sheet-divider" />
        <div className="add-category-row" style={{ marginTop: 14 }}>
          <input
            className="text-input"
            placeholder="New category"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddAndUse();
            }}
          />
          <button className="btn btn-accent" onClick={handleAddAndUse}>
            Add &amp; use
          </button>
        </div>
      </div>
    </div>
  );
}
