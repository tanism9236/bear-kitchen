import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRecipes } from '@/hooks/useRecipes';
import { TAG_DIMENSION_LABELS, TAG_DIMENSION_COLORS } from '@/data/tags';
import {
  getAllTags,
  loadTagGroups,
  loadCategories,
  LIBRARY_CHANGED_EVENT,
} from '@/utils/storage';
import { RecipeCard } from '@/components/RecipeCard';
import { EmptyState } from '@/components/EmptyState';
import type { Tag, TagGroup, Category } from '@/types';

export function RecipesPage() {
  const { recipes, loading } = useRecipes();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tagFilters, setTagFilters] = useState<Set<string>>(new Set());
  const [tagFilterOpen, setTagFilterOpen] = useState(false);

  const [allTags, setAllTags] = useState<Tag[]>(getAllTags);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>(loadTagGroups);
  const [categories, setCategories] = useState<Category[]>(loadCategories);

  useEffect(() => {
    const refresh = () => {
      setAllTags(getAllTags());
      setTagGroups(loadTagGroups());
      setCategories(loadCategories());
    };
    window.addEventListener(LIBRARY_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, refresh);
  }, []);

  const customTags = useMemo(() => allTags.filter((t) => t.isCustom), [allTags]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!recipe.name.toLowerCase().includes(q)) return false;
      }
      // Category
      if (categoryFilter !== 'all' && recipe.category !== categoryFilter) {
        return false;
      }
      // Tags
      if (tagFilters.size > 0) {
        const hasAllTags = Array.from(tagFilters).every((tagId) =>
          recipe.tags.includes(tagId)
        );
        if (!hasAllTags) return false;
      }
      return true;
    });
  }, [recipes, search, categoryFilter, tagFilters]);

  const toggleTag = (tagId: string) => {
    setTagFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const clearTags = () => setTagFilters(new Set());

  const hasFilters = search || categoryFilter !== 'all' || tagFilters.size > 0;

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="recipes-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">小熊厨房</h1>
          <p className="page-subtitle">
            Kitchen isn't where you cook. It's where you live.
          </p>
        </div>
      </div>

      {/* Search + Tag Filter (同一行) */}
      <div className="search-filter-row">
        <div className="search-bar">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="搜索菜名…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>
        <button
          className={`tag-filter-toggle ${tagFilterOpen ? 'expanded' : ''} ${tagFilters.size > 0 ? 'has-selection' : ''}`}
          onClick={() => setTagFilterOpen((v) => !v)}
        >
          <span>
            标签筛选
            {tagFilters.size > 0 && ` · ${tagFilters.size}`}
          </span>
          <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Category Filter (横排胶囊) */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`filter-chip ${categoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Tag Filter Panel (展开) */}
      {tagFilterOpen && (
        <div className="tag-filter-panel">
          <div className="tag-filter-panel-header">
            <span className="tag-filter-panel-title">按标签筛选</span>
            {tagFilters.size > 0 && (
              <button className="tag-filter-clear" onClick={clearTags}>
                清除
              </button>
            )}
          </div>
          {tagGroups.map((group) => {
            const color = TAG_DIMENSION_COLORS[group.dimension];
            return (
              <div key={group.dimension} className="tag-filter-group">
                <span className="tag-filter-group-label">
                  {TAG_DIMENSION_LABELS[group.dimension]}
                </span>
                <div className="filter-tag-chips">
                  {group.tags.map((tagName) => {
                    const id = `${group.dimension}:${tagName}`;
                    const active = tagFilters.has(id);
                    return (
                      <button
                        key={id}
                        className={`filter-chip-sm ${active ? 'active' : ''}`}
                        style={
                          active
                            ? {
                                backgroundColor: color.text,
                                borderColor: color.text,
                                color: '#fff',
                              }
                            : { backgroundColor: color.bg, color: color.text }
                        }
                        onClick={() => toggleTag(id)}
                      >
                        {tagName}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Custom tags */}
          {customTags.length > 0 && (
            <div className="tag-filter-group">
              <span className="tag-filter-group-label">自定义</span>
              <div className="filter-tag-chips">
                {customTags.map((tag) => {
                  const color = TAG_DIMENSION_COLORS.custom;
                  const active = tagFilters.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      className={`filter-chip-sm ${active ? 'active' : ''}`}
                      style={
                        active
                          ? {
                              backgroundColor: color.text,
                              borderColor: color.text,
                              color: '#fff',
                            }
                          : { backgroundColor: color.bg, color: color.text }
                      }
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Bar */}
      <div className="result-bar">
        <span className="filter-result-count">
          找到 {filteredRecipes.length} 道菜
        </span>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="recipe-grid">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={hasFilters ? '🔍' : '🍳'}
          title={hasFilters ? '没有找到匹配的菜谱' : '还没有菜谱'}
          description={
            hasFilters
              ? '试试调整搜索或筛选条件'
              : '点击「添加菜谱」开始记录你的第一道菜'
          }
          action={
            !hasFilters && (
              <Link to="/recipes/new" className="btn btn-primary">
                + 添加菜谱
              </Link>
            )
          }
        />
      )}

      {/* FAB 添加菜谱 */}
      <Link to="/recipes/new" className="fab-add" title="添加菜谱" aria-label="添加菜谱">
        +
      </Link>
    </div>
  );
}
