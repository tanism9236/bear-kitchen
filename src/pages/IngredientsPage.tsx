import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { InventoryIngredient, Category } from '@/types';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItemRow } from '@/components/InventoryItemRow';
import { EmptyState } from '@/components/EmptyState';
import { compareByExpiry } from '@/utils/expiry';

export function IngredientsPage() {
  const { items, categories, loading, setTotalQuantity, setEarliestExpiry } = useInventory();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 搜索和分类筛选只影响查看，不改动数据
  const filtered = useMemo(() => {
    let result = items;
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((i) => i.name.toLowerCase().includes(q));
    if (categoryFilter !== 'all') result = result.filter((i) => i.categoryId === categoryFilter);
    return result;
  }, [items, search, categoryFilter]);

  // 第一层按 Category 分组，第二层组内按到期日升序（无到期日在后）
  const groups = useMemo(() => {
    const map = new Map<string, InventoryIngredient[]>();
    for (const item of filtered) {
      const list = map.get(item.categoryId) ?? [];
      list.push(item);
      map.set(item.categoryId, list);
    }
    for (const list of map.values()) list.sort(compareByExpiry);
    // 按分类库顺序展示；未匹配到分类的排最后
    const ordered: { category: Category | null; list: InventoryIngredient[] }[] = [];
    for (const cat of categories) {
      const list = map.get(cat.id);
      if (list) ordered.push({ category: cat, list });
      map.delete(cat.id);
    }
    for (const list of map.values()) {
      ordered.push({ category: null, list });
    }
    return ordered;
  }, [filtered, categories]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  const total = filtered.length;

  return (
    <div className="ingredients-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">食材库存</h1>
          <p className="page-subtitle">What's in my kitchen?</p>
        </div>
      </div>

      <div className="search-filter-row">
        <div className="search-bar">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="搜索食材…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* Category Filter (横排胶囊，与菜谱首页一致) */}
      <div className="filter-bar-wrap">
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
      </div>

      {total === 0 ? (
        <EmptyState
          icon={search || categoryFilter !== 'all' ? '🔍' : '🥬'}
          title={search || categoryFilter !== 'all' ? '没有找到匹配的食材' : '库存还是空的'}
          description={
            search || categoryFilter !== 'all'
              ? '试试换个关键词或分类'
              : '添加家里的食材，随时知道还有什么、还剩多少'
          }
          action={
            !search && categoryFilter === 'all' && (
              <Link to="/ingredients/new" className="btn btn-primary">
                + 添加食材
              </Link>
            )
          }
        />
      ) : (
        <div className="inv-groups">
          {groups.map(({ category, list }) => (
            <section key={category ? category.id : 'uncategorized'} className="inv-group">
              <h2 className="inv-group-title">{category ? category.name : '未分类'}</h2>
              <div className="inv-group-list">
                {list.map((item) => (
                  <InventoryItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={setTotalQuantity}
                    onUpdateExpiry={setEarliestExpiry}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Link to="/ingredients/new" className="fab-add" title="添加食材" aria-label="添加食材">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}
