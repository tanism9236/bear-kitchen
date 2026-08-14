// ===== Bear Kitchen Types =====

// Categories are user-managed, so ids are dynamic strings
// (built-in ones keep the legacy ids below for seeded sample data).
export type CategoryId = string;

export type TagDimension = 'cuisine' | 'ingredient' | 'flavor' | 'method' | 'custom';

export interface Tag {
  id: string;
  name: string;
  dimension: TagDimension;
  isCustom: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

// ===== V2.0 Inventory (食材库存) =====
// Named InventoryIngredient to avoid clashing with Recipe's Ingredient
// (the per-recipe ingredient line item above).

/**
 * Inventory unit. Defaults below + user-added custom units (stored in
 * localStorage). g/kg/lb and ml/L are convertible; others are count units.
 */
export type InventoryUnit = string;

export const DEFAULT_INVENTORY_UNITS: InventoryUnit[] = ['个', '罐', 'g', 'kg', 'ml', 'L', 'lb'];

/**
 * A stock batch: same ingredient can have multiple batches with different
 * expiry dates (e.g. 牛奶 500ml→8/15 + 1000ml→8/31). quantity 0 batches are
 * kept but excluded from "nearest expiry" calculations.
 */
export interface InventoryBatch {
  id: string;
  quantity: number;
  /** ISO date (YYYY-MM-DD), optional */
  expiryDate?: string;
}

/** A food item stocked at home (inventory entry). */
export interface InventoryIngredient {
  id: string;
  name: string;
  categoryId: string;
  /** Derived: sum of all batches (kept in sync for legacy display/sort). */
  quantity: number;
  unit: InventoryUnit;
  /** Derived: earliest expiry among batches that still have stock. */
  expiryDate?: string;
  /** Stock batches. Legacy data (no batches) is normalized to one batch. */
  batches?: InventoryBatch[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeStep {
  id: string;
  text: string;
}

export interface Recipe {
  id: string;
  name: string;
  coverImage: string | null;
  category: CategoryId;
  tags: string[]; // tag ids
  ingredients: Ingredient[];
  steps: RecipeStep[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: CategoryId;
  name: string;
}

export interface TagGroup {
  dimension: TagDimension;
  label: string;
  tags: string[]; // default tag names
}
