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

export const DEFAULT_INVENTORY_UNITS: InventoryUnit[] = [
  // count
  '个', '包', '盒', '罐', '瓶',
  // weight
  'g', 'kg', 'oz', 'lb',
  // volume
  'ml', 'L', 'fl oz',
];

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

// ===== V2.5 My Kitchen (家庭成员 / 营养目标) =====

export type Gender = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

/** Daily nutrition target (macros in grams). */
export interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A kitchen/family member. First one is seeded as the Owner. */
export interface Member {
  id: string;
  name: string;
  /** e.g. 'Owner' / '成员' — display only, no permissions in V2.5. */
  role: string;
  gender: Gender;
  age: number;
  /** cm */
  height: number;
  /** kg */
  weight: number;
  activityLevel: ActivityLevel;
  nutritionGoal: NutritionGoal;
  createdAt: string;
  updatedAt: string;
}

// ===== V3.0 Plan (家庭饮食计划) =====

export type PlanType = 'daily' | 'weekly' | 'event';

/** Fixed meal slots + free-form custom slots (e.g. 下午茶). */
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | string;

/**
 * A meal item is either a recipe reference (can repeat across meals)
 * or a custom food (饭团 / 外卖 / 预制食品).
 */
export type MealItem =
  | {
      id: string;
      kind: 'recipe';
      recipeId: string;
      /** Display fallback when the referenced recipe was deleted. */
      recipeName: string;
      /** Recipe has no servings field yet — default 1. */
      servings: number;
    }
  | {
      id: string;
      kind: 'custom';
      name: string;
      note?: string;
    };

/** One meal on one day (breakfast/lunch/dinner/custom slot). */
export interface Meal {
  id: string;
  /** Local date, YYYY-MM-DD. */
  date: string;
  slot: MealSlot;
  /** Who eats this meal (member ids, optional). */
  memberIds: string[];
  items: MealItem[];
}

export interface Plan {
  id: string;
  type: PlanType;
  title: string;
  /** Local date YYYY-MM-DD — the day (daily/event) or week start (weekly). */
  startDate: string;
  /** Weekly only: inclusive end of the 7-day range. */
  endDate?: string;
  /**
   * Plan-level members. Meals with empty memberIds inherit these.
   * Optional so existing stored plans load without migration.
   */
  memberIds?: string[];
  /** A plan can be created empty and filled gradually. */
  meals: Meal[];
  createdAt: string;
  updatedAt: string;
}

export const MEAL_SLOT_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
};

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  daily: '单日计划',
  weekly: '一周计划',
  event: '聚餐计划',
};
