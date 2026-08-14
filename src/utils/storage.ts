import type { Recipe, Tag, TagGroup, TagDimension, Category } from '@/types';
import { TAG_GROUPS } from '@/data/tags';
import { CATEGORIES } from '@/data/categories';
import { tagId, generateId } from '@/utils/id';

const RECIPES_KEY = 'bear-kitchen:recipes';
const CUSTOM_TAGS_KEY = 'bear-kitchen:custom-tags';
const TAG_GROUPS_KEY = 'bear-kitchen:tag-groups';
const CATEGORIES_KEY = 'bear-kitchen:categories';
const INIT_KEY = 'bear-kitchen:initialized';

// Broadcast event: fired whenever the tag/category library or recipes
// change outside a useRecipes commit, so mounted hooks can re-sync.
export const LIBRARY_CHANGED_EVENT = 'bear-kitchen:library-changed';

function notifyLibraryChanged(): void {
  window.dispatchEvent(new Event(LIBRARY_CHANGED_EVENT));
}

// ===== Recipe Storage =====

export function loadRecipes(): Recipe[] {
  try {
    const data = localStorage.getItem(RECIPES_KEY);
    if (!data) return [];
    return JSON.parse(data) as Recipe[];
  } catch {
    return [];
  }
}

export function saveRecipes(recipes: Recipe[]): void {
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
}

/** Rewrite tag ids across all recipes (rename). Silently persists. */
function remapTagRefs(map: Record<string, string>): void {
  const entries = Object.keys(map);
  if (entries.length === 0) return;
  const recipes = loadRecipes().map((r) => {
    let changed = false;
    const tags = r.tags.map((t) => {
      if (map[t]) {
        changed = true;
        return map[t];
      }
      return t;
    });
    return changed ? { ...r, tags } : r;
  });
  saveRecipes(recipes);
}

/** Remove tag ids from all recipes (delete). Silently persists. */
function removeTagRefs(ids: string[]): void {
  if (ids.length === 0) return;
  const set = new Set(ids);
  const recipes = loadRecipes().map((r) => {
    const tags = r.tags.filter((t) => !set.has(t));
    return tags.length !== r.tags.length ? { ...r, tags } : r;
  });
  saveRecipes(recipes);
}

// ===== Custom Tag Storage =====

export function loadCustomTags(): Tag[] {
  try {
    const data = localStorage.getItem(CUSTOM_TAGS_KEY);
    if (!data) return [];
    return JSON.parse(data) as Tag[];
  } catch {
    return [];
  }
}

export function saveCustomTags(tags: Tag[]): void {
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
}

export function addCustomTag(name: string): Tag | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const tags = loadCustomTags();
  const existing = tags.find((t) => t.name === trimmed);
  if (existing) return existing;

  const tag: Tag = {
    id: generateId(),
    name: trimmed,
    dimension: 'custom',
    isCustom: true,
  };
  tags.push(tag);
  saveCustomTags(tags);
  notifyLibraryChanged();
  return tag;
}

export function renameCustomTag(id: string, newName: string): boolean {
  const trimmed = newName.trim();
  if (!trimmed) return false;
  const tags = loadCustomTags();
  const tag = tags.find((t) => t.id === id);
  if (!tag) return false;
  if (tags.some((t) => t.id !== id && t.name === trimmed)) return false;
  tag.name = trimmed;
  saveCustomTags(tags);
  // custom tags are referenced by stable generated id -> no recipe rewrite needed
  notifyLibraryChanged();
  return true;
}

export function deleteCustomTag(id: string): void {
  saveCustomTags(loadCustomTags().filter((t) => t.id !== id));
  removeTagRefs([id]);
  notifyLibraryChanged();
}

// ===== Tag Group Storage (per-dimension tag library) =====

export function loadTagGroups(): TagGroup[] {
  try {
    const data = localStorage.getItem(TAG_GROUPS_KEY);
    if (data) return JSON.parse(data) as TagGroup[];
  } catch {
    // fall through to defaults
  }
  return TAG_GROUPS.map((g) => ({ ...g, tags: [...g.tags] }));
}

export function saveTagGroups(groups: TagGroup[]): void {
  localStorage.setItem(TAG_GROUPS_KEY, JSON.stringify(groups));
}

export function addDimensionTag(
  dimension: TagDimension,
  name: string
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const groups = loadTagGroups();
  const group = groups.find((g) => g.dimension === dimension);
  if (!group || group.tags.includes(trimmed)) return null;
  group.tags.push(trimmed);
  saveTagGroups(groups);
  notifyLibraryChanged();
  return tagId(trimmed, dimension);
}

export function renameDimensionTag(
  dimension: TagDimension,
  oldName: string,
  newName: string
): string | null {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return null;
  const groups = loadTagGroups();
  const group = groups.find((g) => g.dimension === dimension);
  if (!group || !group.tags.includes(oldName)) return null;
  if (group.tags.includes(trimmed)) return null; // name collision
  group.tags = group.tags.map((t) => (t === oldName ? trimmed : t));
  saveTagGroups(groups);
  const oldId = tagId(oldName, dimension);
  const newId = tagId(trimmed, dimension);
  remapTagRefs({ [oldId]: newId });
  notifyLibraryChanged();
  return newId;
}

export function deleteDimensionTag(
  dimension: TagDimension,
  name: string
): void {
  const groups = loadTagGroups();
  const group = groups.find((g) => g.dimension === dimension);
  if (!group) return;
  group.tags = group.tags.filter((t) => t !== name);
  saveTagGroups(groups);
  removeTagRefs([tagId(name, dimension)]);
  notifyLibraryChanged();
}

// ===== Category Storage =====

export function loadCategories(): Category[] {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (data) return JSON.parse(data) as Category[];
  } catch {
    // fall through to defaults
  }
  return CATEGORIES.map((c) => ({ ...c }));
}

export function saveCategories(categories: Category[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function addCategory(name: string): Category | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const cats = loadCategories();
  if (cats.some((c) => c.name === trimmed)) return null;
  const cat: Category = { id: generateId(), name: trimmed };
  saveCategories([...cats, cat]);
  notifyLibraryChanged();
  return cat;
}

export function renameCategory(id: string, newName: string): boolean {
  const trimmed = newName.trim();
  if (!trimmed) return false;
  const cats = loadCategories();
  const cat = cats.find((c) => c.id === id);
  if (!cat) return false;
  if (cats.some((c) => c.id !== id && c.name === trimmed)) return false;
  cat.name = trimmed;
  saveCategories(cats);
  // categories are referenced by stable id -> no recipe rewrite needed
  notifyLibraryChanged();
  return true;
}

export function deleteCategory(id: string): number {
  // returns number of affected recipes
  saveCategories(loadCategories().filter((c) => c.id !== id));
  const recipes = loadRecipes();
  let affected = 0;
  const next = recipes.map((r) => {
    if (r.category === id) {
      affected++;
      return { ...r, category: '' };
    }
    return r;
  });
  if (affected > 0) saveRecipes(next);
  notifyLibraryChanged();
  return affected;
}

// ===== Derived lookups =====

export function getCategoryName(id: string): string {
  if (!id) return '未分类';
  return loadCategories().find((c) => c.id === id)?.name ?? '未分类';
}

export function getCategoryById(id: string): Category | undefined {
  return loadCategories().find((c) => c.id === id);
}

// ===== All Tags (library + custom) =====

export function getAllTags(): Tag[] {
  const libraryTags: Tag[] = loadTagGroups().flatMap((group) =>
    group.tags.map((name) => ({
      id: tagId(name, group.dimension),
      name,
      dimension: group.dimension,
      isCustom: false,
    }))
  );
  const customTags = loadCustomTags();
  return [...libraryTags, ...customTags];
}

export function getTagById(id: string): Tag | undefined {
  return getAllTags().find((t) => t.id === id);
}

export function getTagNamesByIds(ids: string[]): string[] {
  const allTags = getAllTags();
  return ids
    .map((id) => allTags.find((t) => t.id === id)?.name)
    .filter((n): n is string => !!n);
}

// ===== Initialization =====

export function isInitialized(): boolean {
  return localStorage.getItem(INIT_KEY) === 'true';
}

export function markInitialized(): void {
  localStorage.setItem(INIT_KEY, 'true');
}
