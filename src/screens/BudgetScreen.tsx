import type { Category, Receipt } from '../types';
import { BudgetList } from '../components/BudgetList';

export function BudgetScreen({
  categories,
  receipts,
  onCategoriesChange,
  onBack,
}: {
  categories: Category[];
  receipts: Receipt[];
  onCategoriesChange: (next: Category[]) => void;
  onBack: () => void;
}) {
  return (
    <div className="screen budget-screen">
      <button className="link-btn back-link" onClick={onBack}>
        ← Scan
      </button>
      <BudgetList categories={categories} receipts={receipts} onCategoriesChange={onCategoriesChange} />
    </div>
  );
}
