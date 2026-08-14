import type { Category } from '@/types';

// V2.0 默认食材分类。用户的增删改存 localStorage，
// 见 utils/inventoryStorage.ts 的 loadIngredientCategories()。
// 注意：与菜谱分类（data/categories.ts）是完全独立的两套分类。
export const INGREDIENT_CATEGORIES: Category[] = [
  { id: 'ing-meat', name: '肉类' },
  { id: 'ing-veg', name: '蔬菜' },
  { id: 'ing-fruit', name: '水果' },
  { id: 'ing-egg-dairy', name: '蛋奶' },
  { id: 'ing-grain', name: '谷薯豆' },
  { id: 'ing-seasoning', name: '调味料' },
];
