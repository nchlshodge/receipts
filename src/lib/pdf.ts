import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { normalizeDate, parseAmount, type ParsedTransaction } from './csvImport';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Extracts text from a PDF, reconstructing rough lines from text-item positions. */
export async function extractPdfText(file: Blob, maxPages = 10): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const lines: string[] = [];
  const pageCount = Math.min(doc.numPages, maxPages);

  for (let p = 1; p <= pageCount; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; str: string }[]>();

    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const row = rows.get(y) ?? [];
      row.push({ x, str: item.str });
      rows.set(y, row);
    }

    const sortedYs = [...rows.keys()].sort((a, b) => b - a); // PDF y grows upward
    for (const y of sortedYs) {
      const rowItems = rows.get(y)!.sort((a, b) => a.x - b.x);
      lines.push(rowItems.map((r) => r.str).join(' ').replace(/\s+/g, ' ').trim());
    }
  }
  return lines.filter(Boolean).join('\n');
}

const SKIP_LINE_WORDS = [
  'beginning balance',
  'ending balance',
  'total ',
  'page ',
  'statement period',
  'account summary',
  'available balance',
  'daily balance',
];
const CREDIT_WORDS = ['deposit', 'credit', 'payroll', 'direct dep', 'refund', 'transfer in', 'interest paid'];
const TRAILING_AMOUNT_RE = /([-+]?\(?\$?[\d,]+\.\d{2}\)?)\s*$/;
const LEADING_DATE_RE = /^(\d{1,2}[/\-]\d{1,2}(?:[/\-]\d{2,4})?)/;

/**
 * Best-effort line parser for freeform bank/credit-card statement text — much less
 * reliable than a clean CSV export, since statement layouts vary widely and the
 * text extraction collapses table columns into plain lines. Meant to be reviewed
 * and corrected in the UI, not trusted blindly.
 */
export function parseStatementText(text: string, statementYear: number = new Date().getFullYear()): ParsedTransaction[] {
  const lines = text
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (SKIP_LINE_WORDS.some((w) => lower.includes(w))) continue;

    const dateMatch = line.match(LEADING_DATE_RE);
    if (!dateMatch) continue;
    const amountMatch = line.match(TRAILING_AMOUNT_RE);
    if (!amountMatch || amountMatch.index === undefined) continue;
    if (amountMatch.index <= dateMatch[0].length) continue;

    let dateStr = dateMatch[1];
    if (dateStr.split(/[/\-]/).length === 2) {
      dateStr = `${dateStr}/${statementYear}`;
    }
    const date = normalizeDate(dateStr);
    if (!date) continue;

    const description = line.slice(dateMatch[0].length, amountMatch.index).trim();
    if (!description) continue;

    const raw = parseAmount(amountMatch[1]);
    if (Number.isNaN(raw) || raw === 0) continue;

    let direction: 'in' | 'out';
    if (amountMatch[1].includes('-') || amountMatch[1].includes('(')) {
      direction = 'out';
    } else if (amountMatch[1].includes('+')) {
      direction = 'in';
    } else {
      direction = CREDIT_WORDS.some((w) => lower.includes(w)) ? 'in' : 'out';
    }

    results.push({ date, description, amount: Math.round(Math.abs(raw) * 100) / 100, direction });
  }
  return results;
}

/** Renders one PDF page to a PNG blob — used as a fallback for scanned/image-only PDFs. */
export async function renderPdfPageToBlob(file: Blob, pageNum = 1, scale = 2): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not render PDF page'))), 'image/png');
  });
}
