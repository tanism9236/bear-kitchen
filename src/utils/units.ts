import type { InventoryUnit } from '@/types';

/**
 * Unit conversion for inventory quantities.
 *
 * Families:
 *  - weight: g / kg / lb
 *  - volume: ml / L
 *  - count:  个 / 罐 (not convertible to anything, not even each other)
 */

const FAMILY: Record<string, string> = {
  g: 'weight',
  kg: 'weight',
  lb: 'weight',
  ml: 'volume',
  L: 'volume',
  个: 'count',
  罐: 'count',
};

/** How many base units (g / ml) one of this unit is worth. */
const TO_BASE: Record<string, number> = {
  g: 1,
  kg: 1000,
  lb: 453.59237,
  ml: 1,
  L: 1000,
};

export function isConvertible(a: InventoryUnit, b: InventoryUnit): boolean {
  if (a === b) return true;
  const fa = FAMILY[a];
  const fb = FAMILY[b];
  // Custom/unknown units have no family: only convertible to themselves.
  return fa !== undefined && fa === fb && fa !== 'count';
}

/**
 * Convert a quantity from one unit to another.
 * Returns null if the units are in different families (e.g. 个 → g).
 */
export function convertQuantity(
  quantity: number,
  from: InventoryUnit,
  to: InventoryUnit
): number | null {
  if (from === to) return quantity;
  if (!isConvertible(from, to)) return null;
  const base = quantity * TO_BASE[from];
  return base / TO_BASE[to];
}

/** Round to a sensible precision and strip trailing zeros (1500, 1.5, 0.5…). */
export function formatQuantity(n: number): string {
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded);
}
