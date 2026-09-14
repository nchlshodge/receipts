import { useRef } from 'react';
import { IMPORT_REMINDER_DAYS, daysSinceImport } from '../lib/derived';

export function Home({
  onFile,
  onManualEntry,
  onOpenSearch,
  onOpenBudget,
  onOpenIncome,
  onOpenImport,
  lastImportAt,
}: {
  onFile: (file: File) => void;
  onManualEntry: () => void;
  onOpenSearch: () => void;
  onOpenBudget: () => void;
  onOpenIncome: () => void;
  onOpenImport: () => void;
  lastImportAt: string | null;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const daysSince = daysSinceImport(lastImportAt);
  const showImportReminder = daysSince === null || daysSince >= IMPORT_REMINDER_DAYS;

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

      {showImportReminder && (
        <button className="import-reminder" onClick={onOpenImport}>
          {daysSince === null
            ? 'Import your bank transactions to get started →'
            : `It's been ${daysSince} day${daysSince === 1 ? '' : 's'} since your last import →`}
        </button>
      )}

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
        <button className="link-btn" onClick={onOpenImport}>
          Import bank CSV
        </button>
      </div>

      <div className="home-bottom-row">
        <button className="budget-nav-btn" onClick={onOpenIncome}>
          Income
        </button>
        <button className="budget-nav-btn" onClick={onOpenBudget}>
          Budget &amp; categories
        </button>
      </div>
    </div>
  );
}
