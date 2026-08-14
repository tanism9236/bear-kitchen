import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { InventoryIngredient } from '@/types';
import { getExpiryStatus, getActiveExpiryDate, getExpiryDisplay } from '@/utils/expiry';
import { formatQuantity } from '@/utils/units';
import { useToast } from '@/components/Toast';

interface InventoryItemRowProps {
  item: InventoryIngredient;
  onUpdateQuantity: (id: string, quantity: number) => boolean;
  onUpdateExpiry: (id: string, expiryDate: string | undefined) => boolean;
}

export function InventoryItemRow({
  item,
  onUpdateQuantity,
  onUpdateExpiry,
}: InventoryItemRowProps) {
  const { showToast } = useToast();
  const status = getExpiryStatus(item);
  const activeDate = getActiveExpiryDate(item);
  const displayText = getExpiryDisplay(item); // null = 无到期状态，不显示
  const usedUp = item.quantity <= 0;

  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState('');
  const qtyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingQty) qtyInputRef.current?.focus();
  }, [editingQty]);

  const startEditQty = () => {
    setQtyDraft(formatQuantity(item.quantity));
    setEditingQty(true);
  };

  const submitQty = () => {
    const q = Number.parseFloat(qtyDraft);
    if (!Number.isFinite(q) || q < 0) {
      showToast('请输入有效的数量', 'error');
      return;
    }
    const ok = onUpdateQuantity(item.id, Math.round(q * 1000) / 1000);
    if (!ok) showToast('保存失败：存储空间不足', 'error');
    setEditingQty(false);
  };

  const submitDate = () => {
    const ok = onUpdateExpiry(item.id, dateDraft || undefined);
    if (!ok) showToast('保存失败：存储空间不足', 'error');
    setEditingDate(false);
  };

  const dateClass =
    status === 'expired'
      ? 'inv-row-date inv-row-date-expired'
      : status === 'today' || status === 'soon'
        ? 'inv-row-date inv-row-date-soon'
        : 'inv-row-date';

  return (
    <div className={`inv-row ${usedUp ? 'used-up' : ''}`}>
      <div className="inv-row-main">
        {/* 只有名称跳转编辑页 */}
        <Link to={`/ingredients/${item.id}/edit`} className="inv-row-name">
          {item.name}
        </Link>

        {/* 数量：居中，点击即改 */}
        <div className="inv-row-qty-cell">
          {usedUp && <span className="inv-badge inv-badge-muted">已用完</span>}

          {editingQty ? (
            <span className="inv-row-edit">
              <input
                ref={qtyInputRef}
                className="inv-row-edit-input"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={qtyDraft}
                onChange={(e) => setQtyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitQty();
                  if (e.key === 'Escape') setEditingQty(false);
                }}
              />
              <button className="inv-row-edit-ok" onClick={submitQty} aria-label="确认">
                ✓
              </button>
            </span>
          ) : (
            <button
              className={`inv-row-qty-btn ${usedUp ? 'inv-row-qty-zero' : ''}`}
              onClick={startEditQty}
              title="点击修改数量"
            >
              {formatQuantity(item.quantity)} {item.unit}
            </button>
          )}
        </div>

        {/* 到期状态：靠右，点击可改最近有效批次的到期日 */}
        <div className="inv-row-date-cell">
          {editingDate ? (
            <span className="inv-row-edit">
              <input
                className="inv-row-edit-input inv-row-edit-date"
                type="date"
                value={dateDraft}
                onChange={(e) => setDateDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitDate();
                  if (e.key === 'Escape') setEditingDate(false);
                }}
              />
              <button className="inv-row-edit-ok" onClick={submitDate} aria-label="确认">
                ✓
              </button>
            </span>
          ) : (
            activeDate && (
              <button
                className={dateClass}
                onClick={() => {
                  setDateDraft(activeDate);
                  setEditingDate(true);
                }}
                title="点击修改到期日"
              >
                {displayText}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
