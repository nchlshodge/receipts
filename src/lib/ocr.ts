import { createWorker } from 'tesseract.js';

export type ParsedItem = { name: string; price: number };
export type ParsedReceipt = { merchant: string; date: string; items: ParsedItem[] };

const STOP_WORDS = [
  'subtotal', 'sub total', 'total', 'sales tax', 'tax', 'cash', 'change due', 'change',
  'balance due', 'amount due', 'visa', 'mastercard', 'debit', 'credit card', 'card #',
  'approved', 'auth code', 'tender', 'payment', 'thank you',
];

const PRICE_RE = /\$?\s*(\d{1,4}\.\d{2})\s*$/;
const DATE_RE = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/;

export async function recognizeReceiptText(
  image: Blob,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

export function parseReceiptText(text: string): ParsedReceipt {
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let date = '';
  for (const line of rawLines) {
    const m = line.match(DATE_RE);
    if (m) {
      const [, mo, da, yrRaw] = m;
      const yr = yrRaw.length === 2 ? `20${yrRaw}` : yrRaw;
      const iso = `${yr.padStart(4, '0')}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`;
      if (!Number.isNaN(Date.parse(iso))) {
        date = iso;
        break;
      }
    }
  }
  if (!date) date = new Date().toISOString().slice(0, 10);

  let merchant = '';
  for (const line of rawLines.slice(0, 6)) {
    const letters = line.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 3 && !PRICE_RE.test(line) && !DATE_RE.test(line)) {
      merchant = line.replace(/[^a-zA-Z0-9&'.,\- ]/g, '').trim();
      break;
    }
  }
  if (!merchant) merchant = 'Unknown Merchant';

  const items: ParsedItem[] = [];
  let stopped = false;
  for (const line of rawLines) {
    const lower = line.toLowerCase();
    if (STOP_WORDS.some((w) => lower.includes(w))) {
      stopped = true;
      continue;
    }
    if (stopped) continue;

    const m = line.match(PRICE_RE);
    if (!m || m.index === undefined) continue;
    const price = Math.round(parseFloat(m[1]) * 100) / 100;
    if (Number.isNaN(price) || price <= 0 || price > 5000) continue;

    let name = line.slice(0, m.index).trim();
    name = name.replace(/[^a-zA-Z0-9&'.,/\- ]/g, '').trim();
    if (!name) name = 'Item';
    items.push({ name, price });
  }

  return { merchant, date, items };
}
