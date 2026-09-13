import type { Category, Receipt } from '../types';
import { firstItemCategory, receiptTotal } from '../lib/derived';
import { getCategory } from '../lib/categories';
import { formatDate, money } from '../lib/format';

export function ReceiptRow({
  receipt,
  categories,
  onClick,
}: {
  receipt: Receipt;
  categories: Category[];
  onClick: () => void;
}) {
  const cat = getCategory(categories, firstItemCategory(receipt));
  const ink = cat.hue == null ? 'oklch(0.45 0.012 85)' : `oklch(0.43 0.095 ${cat.hue})`;

  return (
    <button className="receipt-row" onClick={onClick}>
      <span className="dot" style={{ background: ink }} />
      <span className="receipt-row-mid">
        <span className="receipt-row-merchant">{receipt.merchant}</span>
        <span className="receipt-row-meta">
          {formatDate(receipt.date)} · {receipt.items.length} item{receipt.items.length === 1 ? '' : 's'}
        </span>
      </span>
      <span className="receipt-row-total mono">{money(receiptTotal(receipt))}</span>
    </button>
  );
}
