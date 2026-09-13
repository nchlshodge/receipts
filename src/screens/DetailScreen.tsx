import type { Category, Receipt } from '../types';
import { usePhotoUrl } from '../hooks';
import { getCategory } from '../lib/categories';
import { receiptTotal } from '../lib/derived';
import { formatDate, money } from '../lib/format';
import { CategoryPill } from '../components/CategoryPill';

export function DetailScreen({
  receipt,
  categories,
  onBack,
  onDelete,
}: {
  receipt: Receipt;
  categories: Category[];
  onBack: () => void;
  onDelete: () => void;
}) {
  const photoUrl = usePhotoUrl(receipt.photoId);

  return (
    <div className="screen detail-screen">
      <button className="link-btn" onClick={onBack}>
        ← Back
      </button>
      <h1 className="detail-merchant">{receipt.merchant}</h1>
      <p className="detail-meta">
        {formatDate(receipt.date)} · {money(receiptTotal(receipt))}
      </p>
      {photoUrl && (
        <div className="detail-photo">
          <img src={photoUrl} alt={receipt.merchant} className="photo-preview" />
        </div>
      )}
      {receipt.items.map((item, i) => {
        const cat = getCategory(categories, item.category);
        return (
          <div className="detail-item-row" key={i}>
            <CategoryPill category={cat} />
            <span className="item-name-static">{item.name}</span>
            <span className="mono">{money(item.price)}</span>
          </div>
        );
      })}
      <button className="link-btn delete-link" onClick={onDelete}>
        Delete this receipt
      </button>
    </div>
  );
}
