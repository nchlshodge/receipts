import { get, set, del } from 'idb-keyval';
import type { Category, Receipt } from '../types';
import { DEFAULT_CATEGORIES } from './categories';

const DATA_KEY = 'church-receipts:v1';

export type PersistedData = {
  receipts: Receipt[];
  categories: Category[];
};

export function loadData(): PersistedData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return { receipts: [], categories: DEFAULT_CATEGORIES };
    const parsed = JSON.parse(raw) as PersistedData;
    return {
      receipts: (parsed.receipts ?? []).map((r) => ({ ...r, owed: r.owed ?? false, repaid: r.repaid ?? false })),
      categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
    };
  } catch {
    return { receipts: [], categories: DEFAULT_CATEGORIES };
  }
}

export function saveData(data: PersistedData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export async function savePhoto(id: string, blob: Blob): Promise<void> {
  await set(id, blob);
}

export async function loadPhoto(id: string): Promise<Blob | undefined> {
  return get(id);
}

export async function deletePhoto(id: string): Promise<void> {
  await del(id);
}
