import type { Category, Receipt } from '../types';
import { ReviewCard } from '../components/ReviewCard';

export function ReviewScreen({
  draft,
  categories,
  onChange,
  onOpenSheet,
  onDiscard,
  onSave,
}: {
  draft: Receipt;
  categories: Category[];
  onChange: (next: Receipt) => void;
  onOpenSheet: (index: number) => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="screen review-screen">
      <div className="eyebrow">Here's what I found</div>
      <p className="review-sub">Give it a quick look — tap any label if I filed something in the wrong place.</p>
      <ReviewCard draft={draft} categories={categories} onChange={onChange} onOpenSheet={onOpenSheet} />
      <div className="review-actions">
        <button className="btn btn-outline" onClick={onDiscard}>
          Discard
        </button>
        <button className="btn btn-accent" style={{ flex: 1 }} onClick={onSave}>
          Save receipt
        </button>
      </div>
    </div>
  );
}
