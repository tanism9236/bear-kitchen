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
