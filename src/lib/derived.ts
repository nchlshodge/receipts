import type { Category, IncomeEntry, Receipt } from '../types';

export function receiptTotal(receipt: Receipt | { items: { price: number }[] }): number {
  return Math.round(receipt.items.reduce((sum, it) => sum + it.price, 0) * 100) / 100;
}

export function totalBudget(categories: Category[]): number {
  return Math.round(categories.reduce((sum, c) => sum + c.budget, 0) * 100) / 100;
}

export const IMPORT_REMINDER_DAYS = 7;

/** Days since the last CSV import, or null if one has never happened. */
export function daysSinceImport(lastImportAt: string | null): number | null {
  if (!lastImportAt) return null;
  const ms = Date.now() - new Date(lastImportAt).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ---- Month-scoped spend (real calendar months, for budget-vs-actual and suggestions) ----

export function monthKeyOf(dateIso: string): string {
  return dateIso.slice(0, 7); // "YYYY-MM"
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function categorySpendInMonth(receipts: Receipt[], categoryName: string, monthKey: string): number {
  let sum = 0;
  for (const r of receipts) {
    if (monthKeyOf(r.date) !== monthKey) continue;
    for (const it of r.items) {
      if (it.category === categoryName) sum += it.price;
    }
  }
  return Math.round(sum * 100) / 100;
}

export function totalSpendInMonth(receipts: Receipt[], monthKey: string): number {
  const sum = receipts
    .filter((r) => monthKeyOf(r.date) === monthKey)
    .reduce((total, r) => total + receiptTotal(r), 0);
  return Math.round(sum * 100) / 100;
}

export function sortedCategoryRowsForMonth(
  categories: Category[],
  receipts: Receipt[],
  monthKey: string,
): Array<Category & { spent: number }> {
  const rows = categories.map((c) => ({ ...c, spent: categorySpendInMonth(receipts, c.name, monthKey) }));
  return rows.sort((a, b) => {
    const aOver = a.budget > 0 && a.spent > a.budget;
    const bOver = b.budget > 0 && b.spent > b.budget;
    if (aOver !== bOver) return aOver ? -1 : 1;
    return b.spent - a.spent;
  });
}

/**
 * Average spend for a category over the 2 calendar months before referenceMonthKey.
 * Returns null when there's no receipt data at all in that window (nothing to base a
 * suggestion on), rather than suggesting $0 for every category.
 */
export function suggestedBudget(receipts: Receipt[], categoryName: string, referenceMonthKey: string): number | null {
  const prevMonths = [shiftMonthKey(referenceMonthKey, -1), shiftMonthKey(referenceMonthKey, -2)];
  const hasHistory = receipts.some((r) => prevMonths.includes(monthKeyOf(r.date)));
  if (!hasHistory) return null;
  const total = prevMonths.reduce((sum, mk) => sum + categorySpendInMonth(receipts, categoryName, mk), 0);
  return Math.round(total / prevMonths.length);
}

// ---- Income (mirrors the month-scoped expense helpers above) ----

export function incomeTotalInMonth(income: IncomeEntry[], monthKey: string): number {
  const sum = income.filter((i) => monthKeyOf(i.date) === monthKey).reduce((total, i) => total + i.amount, 0);
  return Math.round(sum * 100) / 100;
}

export function incomeCategoryTotalInMonth(income: IncomeEntry[], categoryName: string, monthKey: string): number {
  const sum = income
    .filter((i) => monthKeyOf(i.date) === monthKey && i.category === categoryName)
    .reduce((total, i) => total + i.amount, 0);
  return Math.round(sum * 100) / 100;
}

/** Income minus everything budgeted — the "does every dollar have a job" line. */
export function unallocatedInMonth(income: IncomeEntry[], categories: Category[], monthKey: string): number {
  return Math.round((incomeTotalInMonth(income, monthKey) - totalBudget(categories)) * 100) / 100;
}

export function filterIncome(income: IncomeEntry[], query: string, filter: string | null): IncomeEntry[] {
  const q = query.trim().toLowerCase();
  return income.filter((i) => {
    const matchesCategory = !filter || i.category === filter;
    const matchesQuery = !q || i.source.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

export function firstItemCategory(receipt: Receipt): string {
  return receipt.items[0]?.category ?? 'Other';
}

export function filterReceipts(receipts: Receipt[], query: string, filter: string | null): Receipt[] {
  const q = query.trim().toLowerCase();
  return receipts.filter((r) => {
    const matchesCategory = !filter || r.items.some((it) => it.category === filter);
    const matchesQuery =
      !q ||
      r.merchant.toLowerCase().includes(q) ||
      r.items.some((it) => it.name.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });
}
