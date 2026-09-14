export type Category = {
  name: string;
  hue: number | null;
  budget: number;
  custom: boolean;
};

export type ReceiptItem = {
  name: string;
  price: number;
  category: string;
};

// A pool of money a transaction moves into/out of. Only one exists today
// ("Checking"), but every transaction already records which account it
// touched so a later move to double-entry accounting is additive, not a
// rewrite: this field plus a chart-of-accounts table is most of the work.
export type Account = {
  id: string;
  name: string;
};

export type Receipt = {
  id: string;
  merchant: string;
  date: string; // ISO yyyy-mm-dd
  items: ReceiptItem[];
  photoId: string | null;
  owed: boolean; // paid out of pocket, waiting on reimbursement
  repaid: boolean; // only meaningful when owed is true
  accountId: string;
};

export type IncomeCategory = {
  name: string;
  hue: number | null;
  custom: boolean;
};

export type IncomeEntry = {
  id: string;
  source: string; // e.g. "Paycheck", "Tax refund", or a freeform description
  date: string; // ISO yyyy-mm-dd
  amount: number;
  category: string;
  accountId: string;
};

export type Screen = 'home' | 'budget' | 'search' | 'scanning' | 'review' | 'detail' | 'income' | 'import';
