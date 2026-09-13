# Church Receipts

A test app for scanning church receipts, auto-sorting line items into budget categories, and keeping a running record of every receipt.

## How it works

- **Scanning** uses [Tesseract.js](https://github.com/naptha/tesseract.js) for free, local OCR — no API key, no per-scan cost. It reads the photo in the browser and pulls out a merchant name, date, and line items.
- **Categorizing** is rule-based keyword matching (see `src/lib/categorize.ts`) against a set of church budget categories — also free, no AI call. Tap any category pill on the Review screen to correct it.
- **Storage** is local to the browser: receipt/category data in `localStorage`, receipt photos in IndexedDB (`src/lib/storage.ts`). Nothing leaves the device.
- **Budgets** are editable per category on the Budget & categories screen (or the desktop dashboard), but nothing requires you to set them — spend tracking works with budgets left at 0.

Because OCR accuracy on real-world photos (crumpled receipts, bad lighting, handwriting) will be lower than a paid AI vision model, the Review screen lets you edit merchant, date, item names, prices, and add/remove items before saving.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. Below ~900px wide you get the phone flow; above it, the desktop dashboard.

## Known gaps (test-app scope)

- Single local user, no accounts/sync — this is a per-browser test, not a shared church system yet.
- No month history — "this month" is just "all saved receipts."
- Deleting a category doesn't reassign items already filed under it.
