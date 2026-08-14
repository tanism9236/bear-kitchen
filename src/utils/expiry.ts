import type { InventoryIngredient } from '@/types';
import { getEarliestActiveExpiry } from '@/utils/batches';

export type ExpiryStatus = 'expired' | 'today' | 'soon' | 'ok' | 'none';

/** Within N days after today counts as 即将过期. */
const SOON_DAYS = 7;

/** 2026-10-29 -> 10/29/2026 */
export function formatExpiryDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function diffDays(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return Number.NaN;
  return Math.round((expiry.getTime() - today.getTime()) / 86400000);
}

/**
 * The expiry date driving home-page status: the earliest date among
 * batches that still have stock (quantity > 0).
 */
export function getActiveExpiryDate(item: InventoryIngredient): string | undefined {
  return getEarliestActiveExpiry(item);
}

export function getExpiryStatus(item: InventoryIngredient): ExpiryStatus {
  const date = getActiveExpiryDate(item);
  if (!date) return 'none';
  const diff = diffDays(date);
  if (Number.isNaN(diff)) return 'none';
  if (diff < 0) return 'expired';
  if (diff === 0) return 'today';
  if (diff <= SOON_DAYS) return 'soon';
  return 'ok';
}

/**
 * Home-page display text based on the nearest active expiry:
 * 已过期 / 今日到期 / 即将过期 (1-7 days) / specific date (>7 days) / null.
 */
export function getExpiryDisplay(item: InventoryIngredient): string | null {
  const status = getExpiryStatus(item);
  if (status === 'none') return null;
  if (status === 'expired') return '已过期';
  if (status === 'today') return '今日到期';
  if (status === 'soon') return '即将过期';
  return formatExpiryDate(getActiveExpiryDate(item)!);
}

/** Sort key: earlier active expiry first; items without expiry last. */
export function compareByExpiry(
  a: InventoryIngredient,
  b: InventoryIngredient
): number {
  const da = getActiveExpiryDate(a);
  const db = getActiveExpiryDate(b);
  if (da && db) return da.localeCompare(db);
  if (da) return -1;
  if (db) return 1;
  return 0;
}
