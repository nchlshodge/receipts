export type ParsedTransaction = {
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // always positive
  direction: 'in' | 'out';
};

const DATE_COLS = ['date', 'transaction date', 'posting date', 'trans date'];
const DESCRIPTION_COLS = ['description', 'memo', 'name', 'payee', 'merchant'];
const AMOUNT_COLS = ['amount'];
const DEBIT_COLS = ['debit', 'withdrawal', 'debit amount'];
const CREDIT_COLS = ['credit', 'deposit', 'credit amount'];

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

function findColumn(header: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = header.findIndex((h) => h.toLowerCase().trim() === candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^0-9.\-()]/g, '').trim();
  if (!cleaned) return NaN;
  const negative = cleaned.startsWith('(') && cleaned.endsWith(')');
  const num = parseFloat(cleaned.replace(/[()]/g, ''));
  if (Number.isNaN(num)) return NaN;
  return negative ? -num : num;
}

function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  const slashMatch = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/);
  if (slashMatch) {
    const [, mo, da, yrRaw] = slashMatch;
    const yr = yrRaw.length === 2 ? `20${yrRaw}` : yrRaw;
    const iso = `${yr.padStart(4, '0')}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`;
    return Number.isNaN(Date.parse(iso)) ? null : iso;
  }
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return null;
}

export function parseBankCsv(text: string): ParsedTransaction[] {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r\n|\n|\r/)
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const dateIdx = findColumn(header, DATE_COLS);
  const descIdx = findColumn(header, DESCRIPTION_COLS);
  const amountIdx = findColumn(header, AMOUNT_COLS);
  const debitIdx = findColumn(header, DEBIT_COLS);
  const creditIdx = findColumn(header, CREDIT_COLS);

  if (dateIdx === -1 || descIdx === -1 || (amountIdx === -1 && debitIdx === -1 && creditIdx === -1)) {
    return [];
  }

  const results: ParsedTransaction[] = [];
  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line);
    const date = normalizeDate(fields[dateIdx] ?? '');
    const description = (fields[descIdx] ?? '').trim();
    if (!date || !description) continue;

    let amount: number;
    let direction: 'in' | 'out';

    if (amountIdx !== -1) {
      const raw = parseAmount(fields[amountIdx] ?? '');
      if (Number.isNaN(raw) || raw === 0) continue;
      amount = Math.abs(raw);
      direction = raw < 0 ? 'out' : 'in';
    } else {
      const debitRaw = debitIdx !== -1 ? parseAmount(fields[debitIdx] ?? '') : NaN;
      const creditRaw = creditIdx !== -1 ? parseAmount(fields[creditIdx] ?? '') : NaN;
      if (!Number.isNaN(debitRaw) && debitRaw !== 0) {
        amount = Math.abs(debitRaw);
        direction = 'out';
      } else if (!Number.isNaN(creditRaw) && creditRaw !== 0) {
        amount = Math.abs(creditRaw);
        direction = 'in';
      } else {
        continue;
      }
    }

    results.push({ date, description, amount: Math.round(amount * 100) / 100, direction });
  }
  return results;
}
