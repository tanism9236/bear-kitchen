import type { InventoryIngredient, InventoryUnit, Category } from '@/types';
import { INGREDIENT_CATEGORIES } from '@/data/ingredientCategories';
import { generateId } from '@/utils/id';
import { convertQuantity } from '@/utils/units';
import { normalizeBatches, syncDerived } from '@/utils/batches';

const INGREDIENTS_KEY = 'bear-kitchen:inventory';
const INGREDIENT_CATEGORIES_KEY = 'bear-kitchen:ingredient-categories';

// Broadcast event: fired whenever the inventory or ingredient category
// library changes outside a useInventory commit, so mounted hooks re-sync.
export const INVENTORY_CHANGED_EVENT = 'bear-kitchen:inventory-changed';

export function notifyInventoryChanged(): void {
  window.dispatchEvent(new Event(INVENTORY_CHANGED_EVENT));
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[bear-kitchen] localStorage 写入失败 (${key}):`, error);
    return false;
  }
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// ===== Inventory Ingredients =====

export function loadInventory(): InventoryIngredient[] {
  try {
    const data = safeGetItem(INGREDIENTS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as InventoryIngredient[];
    if (!Array.isArray(parsed)) return [];
    // Normalize legacy single-expiry items into one-batch items and keep
    // derived fields (quantity / expiryDate) in sync. Non-destructive.
    return parsed.map(syncDerived);
  } catch {
    return [];
  }
}

/** Returns true if persisted, false if localStorage write failed. */
export function saveInventory(items: InventoryIngredient[]): boolean {
  return safeSetItem(INGREDIENTS_KEY, JSON.stringify(items));
}

// ===== Ingredient Categories =====

export function loadIngredientCategories(): Category[] {
  try {
    const data = safeGetItem(INGREDIENT_CATEGORIES_KEY);
    if (data) {
      const parsed = JSON.parse(data) as Category[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fall through to defaults
  }
  return INGREDIENT_CATEGORIES.map((c) => ({ ...c }));
}

export function saveIngredientCategories(cats: Category[]): boolean {
  return safeSetItem(INGREDIENT_CATEGORIES_KEY, JSON.stringify(cats));
}

export function addIngredientCategory(name: string): Category | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const cats = loadIngredientCategories();
  if (cats.some((c) => c.name === trimmed)) return null;
  const cat: Category = { id: generateId(), name: trimmed };
  if (!saveIngredientCategories([...cats, cat])) return null;
  notifyInventoryChanged();
  return cat;
}

export function renameIngredientCategory(id: string, newName: string): boolean {
  const trimmed = newName.trim();
  if (!trimmed) return false;
  const cats = loadIngredientCategories();
  const cat = cats.find((c) => c.id === id);
  if (!cat) return false;
  if (cats.some((c) => c.id !== id && c.name === trimmed)) return false;
  cat.name = trimmed;
  if (!saveIngredientCategories(cats)) return false;
  // categories are referenced by stable id -> no inventory rewrite needed
  notifyInventoryChanged();
  return true;
}

/** How many inventory items currently reference this category. */
export function countIngredientsInCategory(id: string): number {
  return loadInventory().filter((i) => i.categoryId === id).length;
}

export interface DeleteCategoryResult {
  ok: boolean;
  reason?: 'not-found' | 'has-ingredients' | 'write-failed';
}

/**
 * Delete an ingredient category. Safe by design:
 * refuses (has-ingredients) while items still reference it —
 * the caller must move them to another category first.
 */
export function deleteIngredientCategory(id: string): DeleteCategoryResult {
  const cats = loadIngredientCategories();
  if (!cats.some((c) => c.id === id)) return { ok: false, reason: 'not-found' };
  if (countIngredientsInCategory(id) > 0) {
    return { ok: false, reason: 'has-ingredients' };
  }
  if (!saveIngredientCategories(cats.filter((c) => c.id !== id))) {
    return { ok: false, reason: 'write-failed' };
  }
  notifyInventoryChanged();
  return { ok: true };
}

/** Move all ingredients from one category to another (used before delete). */
export function transferIngredients(fromId: string, toId: string): boolean {
  const items = loadInventory().map((i) =>
    i.categoryId === fromId
      ? { ...i, categoryId: toId, updatedAt: new Date().toISOString() }
      : i
  );
  const ok = saveInventory(items);
  if (ok) notifyInventoryChanged();
  return ok;
}

// ===== Add-or-merge (同名合并 + 单位换算) =====

export type AddResult =
  | { status: 'created'; item: InventoryIngredient }
  | { status: 'merged'; item: InventoryIngredient }
  | { status: 'unit-conflict'; existingUnit: InventoryUnit }
  | { status: 'write-failed' };

export interface AddIngredientInput {
  name: string;
  categoryId: string;
  quantity: number;
  unit: InventoryUnit;
  expiryDate?: string;
}

/**
 * Add an ingredient to the inventory.
 * Same-name items stay merged as ONE ingredient: the incoming quantity is
 * converted to the existing item's unit and appended as a new batch (or
 * added to an existing batch with the same expiry date), so different
 * expiry dates are preserved per batch. If the units are in incompatible
 * families (e.g. 个 vs g) the merge is refused, not guessed.
 */
export function addOrMergeIngredient(input: AddIngredientInput): AddResult {
  const name = input.name.trim();
  const items = loadInventory();
  const existing = items.find((i) => i.name === name);

  if (existing) {
    const converted = convertQuantity(input.quantity, input.unit, existing.unit);
    if (converted === null) {
      return { status: 'unit-conflict', existingUnit: existing.unit };
    }
    const now = new Date().toISOString();
    const batches = normalizeBatches(existing).map((b) => ({ ...b }));
    const sameDate = batches.find(
      (b) => (b.expiryDate ?? '') === (input.expiryDate ?? '')
    );
    if (sameDate) {
      sameDate.quantity = Math.round((sameDate.quantity + converted) * 1000) / 1000;
    } else {
      batches.push({
        id: generateId(),
        quantity: converted,
        expiryDate: input.expiryDate || undefined,
      });
    }
    const updated = syncDerived({ ...existing, batches, updatedAt: now });
    const next = items.map((i) => (i.id === existing.id ? updated : i));
    if (!saveInventory(next)) return { status: 'write-failed' };
    notifyInventoryChanged();
    return { status: 'merged', item: updated };
  }

  const now = new Date().toISOString();
  const item = syncDerived({
    id: generateId(),
    name,
    categoryId: input.categoryId,
    quantity: input.quantity,
    unit: input.unit,
    expiryDate: input.expiryDate || undefined,
    batches: [
      {
        id: generateId(),
        quantity: input.quantity,
        expiryDate: input.expiryDate || undefined,
      },
    ],
    createdAt: now,
    updatedAt: now,
  });
  if (!saveInventory([item, ...items])) return { status: 'write-failed' };
  notifyInventoryChanged();
  return { status: 'created', item };
}
