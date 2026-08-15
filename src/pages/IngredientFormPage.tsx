import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { InventoryUnit, InventoryBatch } from '@/types';
import { DEFAULT_INVENTORY_UNITS } from '@/types';
import { useInventory } from '@/hooks/useInventory';
import { useToast } from '@/components/Toast';
import { IngredientCategoryManager } from '@/components/IngredientCategoryManager';
import { addOrMergeIngredient } from '@/utils/inventoryStorage';
import { normalizeBatches } from '@/utils/batches';
import { convertQuantity, formatQuantity } from '@/utils/units';

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Form draft of a stock batch. */
interface BatchDraft {
  id: string;
  quantity: string;
  expiryDate: string;
}

export function IngredientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { getItemById, categories, updateItem, deleteItem } = useInventory();
  const { showToast } = useToast();

  const existing = isEdit ? getItemById(id!) : undefined;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  // 添加模式：单批的数量 / 到期日
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<InventoryUnit>('个');
  const [expiryDate, setExpiryDate] = useState('');
  // 编辑模式：批次列表（每批自己的数量 + 到期日）
  const [batches, setBatches] = useState<BatchDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!isEdit);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isEdit && existing) {
      setName(existing.name);
      setCategoryId(existing.categoryId);
      setQuantity(String(existing.quantity));
      setUnit(existing.unit);
      setExpiryDate(existing.expiryDate ?? '');
      setBatches(
        normalizeBatches(existing).map((b) => ({
          id: b.id,
          quantity: String(b.quantity),
          expiryDate: b.expiryDate ?? '',
        }))
      );
      setLoaded(true);
    }
  }, [isEdit, existing]);

  // 分类被删除后清掉失效的选中项
  useEffect(() => {
    if (categoryId && !categories.some((c) => c.id === categoryId)) {
      setCategoryId('');
    }
  }, [categories, categoryId]);

  // 单位固定为默认列表；已有食材若用了列表外的单位，保底追加显示
  const unitOptions = useMemo(
    () => (unit && !DEFAULT_INVENTORY_UNITS.includes(unit) ? [...DEFAULT_INVENTORY_UNITS, unit] : DEFAULT_INVENTORY_UNITS),
    [unit]
  );

  // 编辑时切换单位：同量纲自动换算数量；不同量纲清空数量要求重填，
  // 避免 "1500 ml" 直接变成 "1500 L" 的含义丢失。
  const handleUnitChange = (next: InventoryUnit) => {
    if (next === unit) return;
    if (isEdit) {
      // 编辑模式：逐批换算，任何一批无法换算则该批清空要求重填
      let anyFailed = false;
      const nextBatches = batches.map((b) => {
        const parsed = Number.parseFloat(b.quantity);
        if (!Number.isFinite(parsed) || b.quantity.trim() === '') return b;
        const converted = convertQuantity(parsed, unit, next);
        if (converted === null) {
          anyFailed = true;
          return { ...b, quantity: '' };
        }
        return { ...b, quantity: String(round3(converted)) };
      });
      setBatches(nextBatches);
      if (anyFailed) {
        setError(`「${unit}」和「${next}」无法换算，请重新输入各批数量`);
      }
    } else {
      const parsed = Number.parseFloat(quantity);
      if (Number.isFinite(parsed) && quantity.trim() !== '') {
        const converted = convertQuantity(parsed, unit, next);
        if (converted !== null) {
          setQuantity(String(round3(converted)));
        } else {
          setQuantity('');
          setError(`「${unit}」和「${next}」无法换算，请重新输入数量`);
        }
      }
    }
    setUnit(next);
  };

  const validBatches = useMemo(
    () =>
      batches.length > 0 &&
      batches.every((b) => {
        const q = Number.parseFloat(b.quantity);
        return Number.isFinite(q) && q >= 0;
      }),
    [batches]
  );

  const canSave = useMemo(() => {
    if (name.trim() === '' || categoryId === '') return false;
    if (isEdit) return validBatches;
    return (
      quantity.trim() !== '' && Number.isFinite(Number.parseFloat(quantity))
    );
  }, [name, categoryId, isEdit, validBatches, quantity]);

  // 编辑模式：批次合计（展示用）
  const batchesTotal = useMemo(() => {
    const sum = batches.reduce(
      (s, b) => s + (Number.isFinite(Number.parseFloat(b.quantity)) ? Number.parseFloat(b.quantity) : 0),
      0
    );
    return formatQuantity(round3(sum));
  }, [batches]);

  const updateBatch = (idx: number, patch: Partial<BatchDraft>) => {
    setBatches((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const addBatchRow = () => {
    setBatches((prev) => [
      ...prev,
      { id: `new-${Date.now()}-${prev.length}`, quantity: '', expiryDate: '' },
    ]);
  };

  const removeBatchRow = (idx: number) => {
    setBatches((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setError(null);
    if (!name.trim()) return setError('请输入食材名称');
    if (!categoryId) return setError('请选择分类');

    if (isEdit && existing) {
      // 编辑模式：直接更新该条目，数量/最近到期日由批次派生
      if (!validBatches) return setError('请为每个批次输入有效的数量（≥ 0）');
      const builtBatches: InventoryBatch[] = batches.map((b) => ({
        id: b.id,
        quantity: round3(Number.parseFloat(b.quantity)),
        expiryDate: b.expiryDate || undefined,
      }));
      const ok = updateItem(existing.id, {
        name: name.trim(),
        categoryId,
        unit,
        batches: builtBatches,
      });
      if (!ok) showToast('保存失败：存储空间不足', 'error');
      else showToast('已保存');
      navigate('/ingredients');
      return;
    }

    const q = Number.parseFloat(quantity);
    if (!Number.isFinite(q) || q < 0) return setError('请输入有效的数量');

    const result = addOrMergeIngredient({
      name,
      categoryId,
      quantity: Math.round(q * 1000) / 1000,
      unit,
      expiryDate: expiryDate || undefined,
    });

    if (result.status === 'unit-conflict') {
      setError(
        `已有「${name.trim()}」的库存单位是 ${result.existingUnit}，` +
          `与 ${unit} 无法换算，不能自动合并。请改用 ${result.existingUnit}，` +
          `或换一个名称。`
      );
      return;
    }
    if (result.status === 'write-failed') {
      showToast('保存失败：存储空间不足', 'error');
      return;
    }
    showToast(
      result.status === 'merged' ? `已合并到「${result.item.name}」` : `已添加「${result.item.name}」`
    );
    navigate('/ingredients');
  };

  const handleDelete = () => {
    if (!existing) return;
    const ok = deleteItem(existing.id);
    if (!ok) {
      showToast('删除失败：存储空间不足', 'error');
      return;
    }
    showToast(`已删除「${existing.name}」`);
    navigate('/ingredients');
  };

  if (isEdit && !loaded) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="inv-form-page">
      <div className="detail-topbar">
        <button className="btn btn-ghost" onClick={() => navigate('/ingredients')}>
          ← 食材
        </button>
        <div className="detail-topbar-actions">
          <button
            className="btn btn-secondary btn-sm form-save-btn"
            disabled={!canSave}
            onClick={handleSave}
          >
            保存
          </button>
          {isEdit && (
            <button
              className="btn detail-delete-btn"
              onClick={() => setConfirmDelete(true)}
            >
              删除
            </button>
          )}
        </div>
      </div>

      <div className="inv-form">
        <div className="form-field">
          <label className="form-label">名称</label>
          <input
            className="input"
            type="text"
            placeholder="如：番茄"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={!isEdit}
          />
        </div>

        <div className="form-field">
          <div className="inv-form-field-head">
            <label className="form-label">分类</label>
            <button
              type="button"
              className={`btn btn-sm ${catManagerOpen ? 'btn-accent' : 'btn-secondary'}`}
              onClick={() => setCatManagerOpen((v) => !v)}
            >
              {catManagerOpen ? '完成' : '管理'}
            </button>
          </div>
          <div className="inv-form-cat-chips">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`filter-chip-sm ${categoryId === c.id ? 'active' : ''}`}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          {catManagerOpen && (
            <IngredientCategoryManager
              categories={categories}
              onClose={() => setCatManagerOpen(false)}
            />
          )}
        </div>

        {isEdit ? (
          /* 编辑模式：批次列表，每批自己的数量 + 到期日 */
          <div className="form-field">
            <div className="inv-form-field-head">
              <label className="form-label inv-batch-label">
                数量{batches.length > 1 ? ` · 共 ${batchesTotal} ${unit}` : ''}
              </label>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={addBatchRow}
              >
                + 添加批次
              </button>
            </div>
            <div className="inv-batch-list">
              {batches.map((b, idx) => (
                <div className="inv-batch-row" key={b.id}>
                  <input
                    className="input inv-batch-qty"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder="数量"
                    value={b.quantity}
                    onChange={(e) => updateBatch(idx, { quantity: e.target.value })}
                  />
                  <select
                    className="inv-batch-unit-select"
                    value={unit}
                    onChange={(e) => handleUnitChange(e.target.value as InventoryUnit)}
                    aria-label="单位"
                  >
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input inv-batch-date"
                    type="date"
                    value={b.expiryDate}
                    onChange={(e) => updateBatch(idx, { expiryDate: e.target.value })}
                  />
                  {batches.length > 1 && (
                    <button
                      type="button"
                      className="inv-batch-remove"
                      aria-label="删除批次"
                      title="删除该批次"
                      onClick={() => removeBatchRow(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="inv-batch-hint">同一食材可分多批，各有自己的数量和到期日</p>
          </div>
        ) : (
          <>
            <div className="form-field">
              <label className="form-label">数量</label>
              <div className="inv-qty-combo">
                <input
                  className="inv-qty-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="如：3"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <span className="inv-qty-divider" />
                <select
                  className="inv-qty-unit"
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value as InventoryUnit)}
                  aria-label="单位"
                >
                  {unitOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">到期日（可选）</label>
              <input
                className="input"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </>
        )}

        {error && <p className="inv-form-error">{error}</p>}

        {!isEdit && (
          <p className="inv-form-hint">
            同名食材会自动合并；到期日不同会分开记批次，数量合计显示。
          </p>
        )}
      </div>

      {/* 删除确认 */}
      {confirmDelete && existing && (
        <div className="overlay" onClick={() => setConfirmDelete(false)}>
          <div className="confirm-dialog animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-dialog-title">删除食材</h3>
            <p className="confirm-dialog-message">
              确定要删除「{existing.name}」吗？
            </p>
            <div className="confirm-dialog-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
