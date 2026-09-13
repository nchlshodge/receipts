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
};

export type Screen = 'home' | 'budget' | 'search' | 'scanning' | 'review' | 'detail';
