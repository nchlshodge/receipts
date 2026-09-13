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

export type Receipt = {
  id: string;
  merchant: string;
  date: string; // ISO yyyy-mm-dd
  items: ReceiptItem[];
  photoId: string | null;
  owed: boolean; // paid out of pocket, waiting on reimbursement
  repaid: boolean; // only meaningful when owed is true
};

export type Screen = 'home' | 'budget' | 'search' | 'scanning' | 'review' | 'detail';
