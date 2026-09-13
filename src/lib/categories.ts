import type { Category } from '../types';

export const HUE_POOL = [185, 95, 320, 265, 20, 130, 45, 290];

export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Facilities & Maintenance', hue: 250, budget: 400, custom: false },
  { name: 'Utilities', hue: 220, budget: 350, custom: false },
  { name: 'Office Supplies', hue: 45, budget: 100, custom: false },
  { name: 'Worship & Music', hue: 300, budget: 150, custom: false },
  { name: "Children's Ministry", hue: 145, budget: 120, custom: false },
  { name: 'Youth Ministry', hue: 35, budget: 120, custom: false },
  { name: 'Outreach & Benevolence', hue: 350, budget: 200, custom: false },
  { name: 'Hospitality & Food', hue: 62, budget: 150, custom: false },
  { name: 'Technology', hue: 155, budget: 80, custom: false },
  { name: 'Other', hue: null, budget: 50, custom: false },
];

export function categoryTint(hue: number | null): string {
  return hue == null ? 'oklch(0.93 0.006 85)' : `oklch(0.935 0.05 ${hue})`;
}

export function categoryInk(hue: number | null): string {
  return hue == null ? 'oklch(0.45 0.012 85)' : `oklch(0.43 0.095 ${hue})`;
}

export function getCategory(categories: Category[], name: string): Category {
  return (
    categories.find((c) => c.name === name) ?? {
      name,
      hue: null,
      budget: 0,
      custom: true,
    }
  );
}

export function nextHue(categories: Category[]): number | null {
  const used = new Set(categories.map((c) => c.hue).filter((h): h is number => h != null));
  for (const h of HUE_POOL) if (!used.has(h)) return h;
  return HUE_POOL[categories.length % HUE_POOL.length];
}

export function addCategory(categories: Category[], rawName: string): { categories: Category[]; name: string } {
  const trimmed = rawName.trim();
  if (!trimmed) return { categories, name: '' };
  const capitalized = trimmed[0].toUpperCase() + trimmed.slice(1);
  const existing = categories.find((c) => c.name.toLowerCase() === capitalized.toLowerCase());
  if (existing) return { categories, name: existing.name };

  const newCat: Category = { name: capitalized, hue: nextHue(categories), budget: 0, custom: true };
  // insert second-to-last so "Other" (or whatever's last) stays at the bottom
  const next = [...categories];
  next.splice(Math.max(0, next.length - 1), 0, newCat);
  return { categories: next, name: capitalized };
}
