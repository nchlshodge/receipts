import { get, set, del } from 'idb-keyval';
import type { Account, Category, IncomeCategory, IncomeEntry, Receipt } from '../types';
import { DEFAULT_CATEGORIES } from './categories';
import { DEFAULT_INCOME_CATEGORIES } from './incomeCategories';

const DATA_KEY = 'church-receipts:v1';
const DEFAULT_ACCOUNT: Account = { id: 'default', name: 'Checking' };

export type PersistedData = {
  receipts: Receipt[];
  categories: Category[];
  accounts: Account[];
  incomeCategories: IncomeCategory[];
  income: IncomeEntry[];
};

function emptyData(): PersistedData {
  return {
    receipts: [],
    categories: DEFAULT_CATEGORIES,
    accounts: [DEFAULT_ACCOUNT],
    incomeCategories: DEFAULT_INCOME_CATEGORIES,
    income: [],
  };
}

export function loadData(): PersistedData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<PersistedData>;
    const accounts = parsed.accounts?.length ? parsed.accounts : [DEFAULT_ACCOUNT];
    const defaultAccountId = accounts[0].id;
    return {
      receipts: (parsed.receipts ?? []).map((r) => ({
        ...r,
        owed: r.owed ?? false,
        repaid: r.repaid ?? false,
        accountId: r.accountId ?? defaultAccountId,
      })),
      categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
      accounts,
      incomeCategories: parsed.incomeCategories?.length ? parsed.incomeCategories : DEFAULT_INCOME_CATEGORIES,
      income: (parsed.income ?? []).map((i) => ({ ...i, accountId: i.accountId ?? defaultAccountId })),
    };
  } catch {
    return emptyData();
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
