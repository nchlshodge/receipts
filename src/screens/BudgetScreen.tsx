import type { Account, Category, IncomeEntry, Receipt } from '../types';
import { BudgetList } from '../components/BudgetList';
import { AccountsPanel } from '../components/AccountsPanel';

export function BudgetScreen({
  categories,
  receipts,
  income,
  accounts,
  onCategoriesChange,
  onAccountsChange,
  onBack,
}: {
  categories: Category[];
  receipts: Receipt[];
  income: IncomeEntry[];
  accounts: Account[];
  onCategoriesChange: (next: Category[]) => void;
  onAccountsChange: (next: Account[]) => void;
  onBack: () => void;
}) {
  return (
    <div className="screen budget-screen">
      <button className="link-btn back-link" onClick={onBack}>
        ← Scan
      </button>
      <BudgetList categories={categories} receipts={receipts} income={income} onCategoriesChange={onCategoriesChange} />
      <AccountsPanel accounts={accounts} onAccountsChange={onAccountsChange} />
    </div>
  );
}
