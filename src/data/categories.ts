import type { Category } from '@/types';

// Default (built-in) categories. User additions/edits live in
// localStorage — see loadCategories() in utils/storage.ts.
export const CATEGORIES: Category[] = [
  { id: 'private', name: '私房菜' },
  { id: 'home', name: '家常菜' },
  { id: 'cold', name: '凉菜' },
  { id: 'soup', name: '汤羹' },
  { id: 'staple', name: '主食' },
  { id: 'dessert', name: '甜品' },
  { id: 'drink', name: '饮品' },
];

