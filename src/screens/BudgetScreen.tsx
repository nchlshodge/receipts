import type { Category, IncomeEntry, Receipt } from '../types';
import { BudgetList } from '../components/BudgetList';

export function BudgetScreen({
  categories,
  receipts,
  income,
  onCategoriesChange,
  onBack,
}: {
  categories: Category[];
  receipts: Receipt[];
  income: IncomeEntry[];
  onCategoriesChange: (next: Category[]) => void;
  onBack: () => void;
}) {
  return (
    <div className="screen budget-screen">
      <button className="link-btn back-link" onClick={onBack}>
        ← Scan
      </button>
      <BudgetList categories={categories} receipts={receipts} income={income} onCategoriesChange={onCategoriesChange} />
    </div>
  );
}
