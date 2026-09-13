import type { Category, Receipt } from '../types';

export function categorySpend(receipts: Receipt[], categoryName: string): number {
  let sum = 0;
  for (const r of receipts) {
    for (const it of r.items) {
      if (it.category === categoryName) sum += it.price;
    }
  }
  return Math.round(sum * 100) / 100;
}

export function receiptTotal(receipt: Receipt | { items: { price: number }[] }): number {
  return Math.round(receipt.items.reduce((sum, it) => sum + it.price, 0) * 100) / 100;
}

export function totalSpend(receipts: Receipt[]): number {
  return Math.round(receipts.reduce((sum, r) => sum + receiptTotal(r), 0) * 100) / 100;
}

export function totalBudget(categories: Category[]): number {
  return Math.round(categories.reduce((sum, c) => sum + c.budget, 0) * 100) / 100;
}

export function sortedCategoryRows(categories: Category[], receipts: Receipt[]): Array<Category & { spent: number }> {
  const rows = categories.map((c) => ({ ...c, spent: categorySpend(receipts, c.name) }));
  return rows.sort((a, b) => {
    const aOver = a.budget > 0 && a.spent > a.budget;
    const bOver = b.budget > 0 && b.spent > b.budget;
    if (aOver !== bOver) return aOver ? -1 : 1;
    return b.spent - a.spent;
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
