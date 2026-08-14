import type { InventoryIngredient, InventoryBatch } from '@/types';
import { generateId } from '@/utils/id';

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Always returns >= 1 batch. Legacy items (single quantity + expiryDate)
 * are treated as a single batch — no data loss, no rewrite required.
 */
export function normalizeBatches(item: InventoryIngredient): InventoryBatch[] {
  if (
    Array.isArray(item.batches) &&
    item.batches.length > 0 &&
    item.batches.every((b) => b && typeof b.quantity === 'number')
  ) {
    return item.batches;
  }
  return [
    { id: generateId(), quantity: item.quantity ?? 0, expiryDate: item.expiryDate },
  ];
}

/**
 * The expiry date that drives the home-page status:
 * the earliest date among batches that still have stock (quantity > 0).
 * Batches with quantity 0 never participate.
 */
export function getEarliestActiveExpiry(
  item: InventoryIngredient
): string | undefined {
  const dates = normalizeBatches(item)
    .filter((b) => b.quantity > 0 && b.expiryDate)
    .map((b) => b.expiryDate as string)
    .sort();
  return dates[0];
}

/** Recompute derived fields: quantity = batch sum, expiryDate = earliest active. */
export function syncDerived(item: InventoryIngredient): InventoryIngredient {
  const batches = normalizeBatches(item);
  const quantity = round3(batches.reduce((s, b) => s + (b.quantity || 0), 0));
  const expiryDate = getEarliestActiveExpiry({ ...item, batches });
  return { ...item, batches, quantity, expiryDate };
}

/**
 * Set a new total quantity across batches, preserving batch dates:
 * - increase -> added to the last batch
 * - decrease -> consumed FIFO from the earliest-expiring batches first
 */
export function withTotalQuantity(
  item: InventoryIngredient,
  total: number
): InventoryIngredient {
  const batches = normalizeBatches(item).map((b) => ({ ...b }));
  const current = round3(batches.reduce((s, b) => s + b.quantity, 0));
  const diff = round3(total - current);
  if (diff > 0) {
    const target = batches[batches.length - 1];
    target.quantity = round3(target.quantity + diff);
  } else if (diff < 0) {
    let need = round3(-diff);
    const order = [...batches].sort((a, b) =>
      (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31')
    );
    for (const b of order) {
      const take = Math.min(b.quantity, need);
      b.quantity = round3(b.quantity - take);
      need = round3(need - take);
      if (need <= 0) break;
    }
  }
  return syncDerived({ ...item, batches });
}

/**
 * Edit the expiry of the batch that currently drives the home-page status
 * (the earliest active batch). If none has a date, target the first batch
 * with stock; as a last resort the first batch.
 */
export function withEarliestExpiry(
  item: InventoryIngredient,
  expiryDate: string | undefined
): InventoryIngredient {
  const batches = normalizeBatches(item).map((b) => ({ ...b }));
  const active = batches
    .filter((b) => b.quantity > 0 && b.expiryDate)
    .sort((a, b) => (a.expiryDate! < b.expiryDate! ? -1 : 1));
  const target = active[0] ?? batches.find((b) => b.quantity > 0) ?? batches[0];
  target.expiryDate = expiryDate || undefined;
  return syncDerived({ ...item, batches });
}
