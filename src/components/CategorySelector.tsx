import { useEffect, useState } from 'react';
import {
  LIBRARY_CHANGED_EVENT,
  loadCategories,
  addCategory,
  renameCategory,
  deleteCategory,
  loadRecipes,
} from '@/utils/storage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Category } from '@/types';

interface CategorySelectorProps {
  selected: string;
  onChange: (categoryId: string) => void;
}

interface PendingDelete {
  category: Category;
  affectedCount: number;
}

export function CategorySelector({ selected, onChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [adding, setAdding] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [managing, setManaging] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  useEffect(() => {
    const refresh = () => setCategories(loadCategories());
    window.addEventListener(LIBRARY_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, refresh);
  }, []);

  const confirmAdd = () => {
    const name = addValue.trim();
    if (!name) return;
    const cat = addCategory(name);
    if (cat) onChange(cat.id);
    setCategories(loadCategories());
    setAddValue('');
  };

  const confirmRename = () => {
    if (!renaming) return;
    const newName = renameValue.trim();
    if (!newName) return;
    renameCategory(renaming, newName);
    setCategories(loadCategories());
    setRenaming(null);
  };

  const requestDelete = (category: Category) => {
    const affectedCount = loadRecipes().filter((r) => r.category === category.id).length;
    setPendingDelete({ category, affectedCount });
  };

  const doDelete = () => {
    if (!pendingDelete) return;
    deleteCategory(pendingDelete.category.id);
    if (selected === pendingDelete.category.id) onChange('');
    setCategories(loadCategories());
    setPendingDelete(null);
  };

  return (
    <div className="category-selector">
      <div className="category-selector-toolbar">
        <button
          type="button"
          className="tag-group-action"
          onClick={() => (adding ? setAdding(false) : setAdding(true))}
        >
          {adding ? '收起' : '＋ 新增分类'}
        </button>
        <button
          type="button"
          className={`tag-group-action ${managing ? 'active' : ''}`}
          onClick={() => {
            setManaging((v) => !v);
            setRenaming(null);
          }}
        >
          {managing ? '完成' : '管理'}
        </button>
      </div>

      {adding && (
        <div className="tag-add-row">
          <input
            type="text"
            className="input"
            placeholder="输入分类名称"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmAdd();
              }
              if (e.key === 'Escape') setAdding(false);
            }}
            autoFocus
          />
          <button type="button" className="btn btn-sm btn-primary" onClick={confirmAdd}>
            添加
          </button>
        </div>
      )}

      <div className="category-chip-list">
        {categories.map((cat) => {
          if (renaming === cat.id) {
            return (
              <span className="tag-edit-chip" key={cat.id}>
                <input
                  className="tag-edit-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmRename();
                    }
                    if (e.key === 'Escape') setRenaming(null);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="tag-edit-confirm"
                  onClick={confirmRename}
                  aria-label="确认改名"
                >
                  ✓
                </button>
              </span>
            );
          }
          return (
            <span className={`tag-toggle-wrap ${managing ? 'managing' : ''}`} key={cat.id}>
              <button
                type="button"
                className={`category-chip ${selected === cat.id ? 'active' : ''}`}
                onClick={() => (managing ? (setRenaming(cat.id), setRenameValue(cat.name)) : onChange(cat.id))}
              >
                {cat.name}
              </button>
              {managing && (
                <button
                  type="button"
                  className="tag-toggle-delete"
                  aria-label={`删除分类 ${cat.name}`}
                  onClick={() => requestDelete(cat)}
                >
                  ×
                </button>
              )}
            </span>
          );
        })}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`删除分类「${pendingDelete?.category.name ?? ''}」？`}
        message={
          pendingDelete && pendingDelete.affectedCount > 0
            ? `该分类下还有 ${pendingDelete.affectedCount} 道菜谱，删除后这些菜谱将变为「未分类」。`
            : '删除后无法恢复。'
        }
        confirmText="删除"
        danger
        onConfirm={doDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
