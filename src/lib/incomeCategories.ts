import type { IncomeCategory } from '../types';

export const INCOME_HUE_POOL = [155, 220, 300, 45, 350, 185, 95, 265];

export const DEFAULT_INCOME_CATEGORIES: IncomeCategory[] = [
  { name: 'Paycheck', hue: 155, custom: false },
  { name: 'Self-Employment', hue: 220, custom: false },
  { name: 'Investments', hue: 300, custom: false },
  { name: 'Gifts', hue: 45, custom: false },
  { name: 'Other', hue: null, custom: false },
];

export function nextIncomeHue(categories: IncomeCategory[]): number | null {
  const used = new Set(categories.map((c) => c.hue).filter((h): h is number => h != null));
  for (const h of INCOME_HUE_POOL) if (!used.has(h)) return h;
  return INCOME_HUE_POOL[categories.length % INCOME_HUE_POOL.length];
}

export function addIncomeCategory(
  categories: IncomeCategory[],
  rawName: string,
): { categories: IncomeCategory[]; name: string } {
  const trimmed = rawName.trim();
  if (!trimmed) return { categories, name: '' };
  const capitalized = trimmed[0].toUpperCase() + trimmed.slice(1);
  const existing = categories.find((c) => c.name.toLowerCase() === capitalized.toLowerCase());
  if (existing) return { categories, name: existing.name };

  const newCat: IncomeCategory = { name: capitalized, hue: nextIncomeHue(categories), custom: true };
  const next = [...categories];
  next.splice(Math.max(0, next.length - 1), 0, newCat);
  return { categories: next, name: capitalized };
}
