import { useEffect, useRef, useState } from 'react';
import type { Category, Receipt, Screen } from './types';
import { loadData, saveData, savePhoto, deletePhoto } from './lib/storage';
import { recognizeReceiptText, parseReceiptText } from './lib/ocr';
import { categorize } from './lib/categorize';
import { useMediaQuery } from './hooks';

import { Home } from './screens/Home';
import { BudgetScreen } from './screens/BudgetScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ScanningScreen } from './screens/ScanningScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { DetailScreen } from './screens/DetailScreen';
import { DesktopDashboard } from './screens/DesktopDashboard';
import { CategorySheet } from './components/CategorySheet';

function newId(): string {
  return crypto.randomUUID();
}

export default function App() {
  const initial = useRef(loadData()).current;
  const [categories, setCategories] = useState<Category[]>(initial.categories);
  const [receipts, setReceipts] = useState<Receipt[]>(initial.receipts);

  const [screen, setScreen] = useState<Screen>('home');
  const [prevScreen, setPrevScreen] = useState<Screen>('home');
  const [draft, setDraft] = useState<Receipt | null>(null);
  const [draftPhotoFile, setDraftPhotoFile] = useState<File | null>(null);
  const [draftPhotoUrl, setDraftPhotoUrl] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [sheetIndex, setSheetIndex] = useState<number | null>(null);
  const [scanStatus, setScanStatus] = useState('Reading the receipt…');

  const isDesktop = useMediaQuery('(min-width: 900px)');

  useEffect(() => {
    saveData({ categories, receipts });
  }, [categories, receipts]);

  useEffect(() => {
    return () => {
      if (draftPhotoUrl) URL.revokeObjectURL(draftPhotoUrl);
    };
  }, [draftPhotoUrl]);

  async function handleFile(file: File) {
    setDraftPhotoFile(file);
    setDraftPhotoUrl(URL.createObjectURL(file));
    setScreen('scanning');
    setScanStatus('Reading the receipt…');

    try {
      const text = await recognizeReceiptText(file, (fraction) => {
        setScanStatus(`Reading the receipt… ${Math.round(fraction * 100)}%`);
      });
      const parsed = parseReceiptText(text);
      setScanStatus(
        `Sorting ${parsed.items.length} item${parsed.items.length === 1 ? '' : 's'} into categories…`,
      );

      const items = parsed.items.map((it) => ({
        name: it.name,
        price: it.price,
        category: categorize(it.name, parsed.merchant, categories),
      }));

      const newDraft: Receipt = {
        id: newId(),
        merchant: parsed.merchant,
        date: parsed.date,
        items,
        photoId: null,
      };

      setTimeout(() => {
        setDraft(newDraft);
        setScreen('review');
      }, 500);
    } catch (err) {
      console.error('OCR failed', err);
      const newDraft: Receipt = {
        id: newId(),
        merchant: 'Unknown Merchant',
        date: new Date().toISOString().slice(0, 10),
        items: [],
        photoId: null,
      };
      setDraft(newDraft);
      setScreen('review');
    }
  }

  function discardDraft() {
    setDraft(null);
    setDraftPhotoFile(null);
    if (draftPhotoUrl) URL.revokeObjectURL(draftPhotoUrl);
    setDraftPhotoUrl(null);
    setSheetIndex(null);
    setScreen('home');
  }

  async function saveDraft() {
    if (!draft) return;
    let photoId: string | null = null;
    if (draftPhotoFile) {
      photoId = draft.id;
      await savePhoto(photoId, draftPhotoFile);
    }
    const saved: Receipt = { ...draft, photoId };
    setReceipts((prev) => [saved, ...prev]);
    setDraft(null);
    setDraftPhotoFile(null);
    if (draftPhotoUrl) URL.revokeObjectURL(draftPhotoUrl);
    setDraftPhotoUrl(null);
    setSheetIndex(null);
    setScreen('home');
  }

  function openDetail(id: string, from: Screen) {
    setDetailId(id);
    setPrevScreen(from);
    setScreen('detail');
  }

  async function deleteReceipt(id: string) {
    const receipt = receipts.find((r) => r.id === id);
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    if (receipt?.photoId) await deletePhoto(receipt.photoId);
    setDetailId(null);
    setScreen(prevScreen);
  }

  function assignCategory(categoryName: string) {
    if (sheetIndex === null || !draft) return;
    const items = draft.items.map((it, i) => (i === sheetIndex ? { ...it, category: categoryName } : it));
    setDraft({ ...draft, items });
    setSheetIndex(null);
  }

  const detailReceipt = detailId ? receipts.find((r) => r.id === detailId) ?? null : null;
  const sheetItem = sheetIndex !== null && draft ? draft.items[sheetIndex] : null;

  function renderMobileScreen() {
    switch (screen) {
      case 'home':
        return (
          <Home onFile={handleFile} onOpenSearch={() => setScreen('search')} onOpenBudget={() => setScreen('budget')} />
        );
      case 'budget':
        return (
          <BudgetScreen
            categories={categories}
            receipts={receipts}
            onCategoriesChange={setCategories}
            onBack={() => setScreen('home')}
          />
        );
      case 'search':
        return (
          <SearchScreen
            receipts={receipts}
            categories={categories}
            query={query}
            filter={filter}
            onQueryChange={setQuery}
            onFilterChange={setFilter}
            onOpenReceipt={(id) => openDetail(id, 'search')}
            onDone={() => setScreen('home')}
          />
        );
      case 'scanning':
        return <ScanningScreen photoUrl={draftPhotoUrl} status={scanStatus} onCancel={discardDraft} />;
      case 'review':
        return draft ? (
          <ReviewScreen
            draft={draft}
            categories={categories}
            onChange={setDraft}
            onOpenSheet={setSheetIndex}
            onDiscard={discardDraft}
            onSave={saveDraft}
          />
        ) : null;
      case 'detail':
        return detailReceipt ? (
          <DetailScreen
            receipt={detailReceipt}
            categories={categories}
            onBack={() => setScreen(prevScreen)}
            onDelete={() => deleteReceipt(detailReceipt.id)}
          />
        ) : null;
      default:
        return null;
    }
  }

  return (
    <>
      {isDesktop ? (
        <>
          <DesktopDashboard
            categories={categories}
            receipts={receipts}
            query={query}
            filter={filter}
            onCategoriesChange={setCategories}
            onQueryChange={setQuery}
            onFilterChange={setFilter}
            onOpenReceipt={(id) => openDetail(id, 'home')}
            onFile={handleFile}
          />
          {(screen === 'scanning' || screen === 'review' || screen === 'detail') && (
            <div className="modal-scrim">
              <div className="modal-card">{renderMobileScreen()}</div>
            </div>
          )}
        </>
      ) : (
        renderMobileScreen()
      )}

      {sheetItem && (
        <CategorySheet
          itemName={sheetItem.name || 'this item'}
          categories={categories}
          currentCategory={sheetItem.category}
          onSelect={assignCategory}
          onCategoriesChange={setCategories}
          onClose={() => setSheetIndex(null)}
        />
      )}
    </>
  );
}
