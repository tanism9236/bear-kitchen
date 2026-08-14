import { useState } from 'react';
import type { Category } from '@/types';
import {
  addIngredientCategory,
  renameIngredientCategory,
  deleteIngredientCategory,
  countIngredientsInCategory,
  transferIngredients,
} from '@/utils/inventoryStorage';
import { useToast } from '@/components/Toast';

interface IngredientCategoryManagerProps {
  categories: Category[];
  onClose: () => void;
}

export function IngredientCategoryManager({
  categories,
  onClose,
}: IngredientCategoryManagerProps) {
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  // transfer-before-delete dialog state
  const [transferCat, setTransferCat] = useState<Category | null>(null);
  const [transferCount, setTransferCount] = useState(0);
  const [transferTarget, setTransferTarget] = useState('');
  // plain delete confirm state
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);

  const submitAdd = () => {
    const cat = addIngredientCategory(newName);
    if (!cat) {
      showToast('添加失败：名称为空或已存在', 'error');
      return;
    }
    setNewName('');
    setAdding(false);
  };

  const submitRename = (id: string) => {
    if (!renameIngredientCategory(id, renameDraft)) {
      showToast('重命名失败：名称为空或已存在', 'error');
      return;
    }
    setRenamingId(null);
  };

  const askDelete = (cat: Category) => {
    const count = countIngredientsInCategory(cat.id);
    if (count > 0) {
      setTransferCat(cat);
      setTransferCount(count);
      setTransferTarget('');
    } else {
      setDeleteCat(cat);
    }
  };

  const confirmTransferDelete = () => {
    if (!transferCat || !transferTarget) return;
    if (!transferIngredients(transferCat.id, transferTarget)) {
      showToast('转移失败，请重试', 'error');
      return;
    }
    const result = deleteIngredientCategory(transferCat.id);
    if (!result.ok) {
      showToast('删除失败，请重试', 'error');
      return;
    }
    showToast(`已删除「${transferCat.name}」，${transferCount} 个食材已转移`);
    setTransferCat(null);
  };

  const confirmDelete = () => {
    if (!deleteCat) return;
    const result = deleteIngredientCategory(deleteCat.id);
    if (!result.ok) {
      showToast('删除失败，请重试', 'error');
      return;
    }
    showToast(`已删除分类「${deleteCat.name}」`);
    setDeleteCat(null);
  };

  const others = categories.filter((c) => c.id !== transferCat?.id);

  return (
    <div className="inv-cat-manager animate-slideDown">
      <div className="inv-cat-manager-header">
        <span className="inv-cat-manager-title">管理分类</span>
        <div className="inv-cat-manager-actions">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>
            收起
          </button>
        </div>
      </div>

      <div className="inv-cat-manager-chips">
        {categories.map((cat) =>
          renamingId === cat.id ? (
            <span key={cat.id} className="inv-cat-rename">
              <input
                className="input inv-cat-rename-input"
                value={renameDraft}
                autoFocus
                onChange={(e) => setRenameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(cat.id);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
              />
              <button
                className="inv-cat-rename-ok"
                onClick={() => submitRename(cat.id)}
                aria-label="确认"
              >
                ✓
              </button>
            </span>
          ) : (
            <span key={cat.id} className="inv-cat-chip editing">
              {cat.name}
              <button
                className="inv-cat-chip-edit"
                aria-label="重命名"
                onClick={() => {
                  setRenamingId(cat.id);
                  setRenameDraft(cat.name);
                }}
              >
                ✎
              </button>
              <button
                className="inv-cat-chip-delete"
                aria-label="删除"
                onClick={() => askDelete(cat)}
              >
                ×
              </button>
            </span>
          )
        )}
        {adding ? (
          <span className="inv-cat-rename">
            <input
              className="input inv-cat-rename-input"
              placeholder="新分类名"
              value={newName}
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitAdd();
                if (e.key === 'Escape') setAdding(false);
              }}
            />
            <button className="inv-cat-rename-ok" onClick={submitAdd} aria-label="确认">
              ✓
            </button>
          </span>
        ) : (
          <button className="inv-cat-add" onClick={() => setAdding(true)}>
            ＋ 添加
          </button>
        )}
      </div>

      {/* 有食材的分类：先转移再删除 */}
      {transferCat && (
        <div className="overlay" onClick={() => setTransferCat(null)}>
          <div className="confirm-dialog animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-dialog-title">删除「{transferCat.name}」</h3>
            <p className="confirm-dialog-message">
              该分类下还有 {transferCount} 个食材，不能直接删除。
              请先把这些食材转移到其他分类。
            </p>
            <div className="inv-transfer-select">
              <label className="form-label">转移至</label>
              <select
                className="select"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
              >
                <option value="">选择分类…</option>
                {others.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="confirm-dialog-actions">
              <button className="btn btn-secondary" onClick={() => setTransferCat(null)}>
                取消
              </button>
              <button
                className="btn btn-danger"
                disabled={!transferTarget}
                onClick={confirmTransferDelete}
              >
                转移并删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 空分类：确认删除 */}
      {deleteCat && (
        <div className="overlay" onClick={() => setDeleteCat(null)}>
          <div className="confirm-dialog animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-dialog-title">删除分类</h3>
            <p className="confirm-dialog-message">
              确定要删除「{deleteCat.name}」吗？该分类下没有食材。
            </p>
            <div className="confirm-dialog-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteCat(null)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
