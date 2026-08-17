import type { InventoryUnit } from '@/types';

/**
 * Unit conversion for inventory quantities.
 *
 * Families:
 *  - weight: g / kg / oz / lb  (base: g)
 *    1 kg = 1000 g · 1 lb = 453.59237 g · 1 oz = 28.349523125 g
 *  - volume: ml / L / fl oz    (base: ml)
 *    1 L = 1000 ml · 1 US fl oz = 29.5735 ml
 *  - count:  个 / 包 / 盒 / 罐 / 瓶  (never auto-converted, not even between themselves)
 *
 * Cross-family (e.g. g ↔ ml, oz ↔ fl oz, lb ↔ L) → null (无法比较).
 */

const FAMILY: Record<string, string> = {
  // weight
  g: 'weight',
  kg: 'weight',
  oz: 'weight',
  lb: 'weight',
  // volume
  ml: 'volume',
  L: 'volume',
  'fl oz': 'volume',
  // count
  个: 'count',
  包: 'count',
  盒: 'count',
  罐: 'count',
  瓶: 'count',
};

/** How many base units (g for weight, ml for volume) one of this unit is worth. */
const TO_BASE: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
  ml: 1,
  L: 1000,
  'fl oz': 29.5735,
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
