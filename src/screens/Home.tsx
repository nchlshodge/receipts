import { useRef } from 'react';

export function Home({
  onFile,
  onManualEntry,
  onOpenSearch,
  onOpenBudget,
}: {
  onFile: (file: File) => void;
  onManualEntry: () => void;
  onOpenSearch: () => void;
  onOpenBudget: () => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="screen home-screen">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />

      <div className="home-top-row">
        <h1 className="home-title">Receipts</h1>
        <button className="search-btn" onClick={onOpenSearch} aria-label="Search">
          ⌕
        </button>
      </div>

      <div className="home-center">
        <div className="hero-wrap">
          <div className="halo" />
          <button className="hero-btn" onClick={() => cameraRef.current?.click()}>
            <span className="camera-glyph">
              <span className="camera-body" />
              <span className="camera-lens" />
            </span>
            <span>Scan a receipt</span>
          </button>
        </div>
        <p className="home-helper">
          Point your camera at it — I'll pull out the items and file them for you.
        </p>
        <button className="link-btn" onClick={() => fileRef.current?.click()}>
          Upload a photo instead
        </button>
        <button className="link-btn" onClick={onManualEntry}>
          No receipt? Log it manually
        </button>
      </div>

      <button className="budget-nav-btn" onClick={onOpenBudget}>
        Budget &amp; categories
      </button>
    </div>
  );
}
