import type { Ingredient, InventoryIngredient, InventoryUnit } from '@/types';
import { convertQuantity, formatQuantity } from '@/utils/units';

/**
 * V2.1 Recipe × Ingredients 联动 — 库存查看（只读，不修改库存）。
 *
 * 规则：
 *  - Recipe.amount 必须是纯数字（"少许"/"适量"/"1-2" 等 → 无法计算库存）
 *  - 按 name 精确匹配库存食材（trim 后比较）
 *  - 用 convertQuantity 把库存量换算到 Recipe 单位再比较
 *  - 不足时显示「还需要 X [recipe unit]」，跨单位换算加「约」
 *  - 单位不可换算（跨族 / count 族之间）→ 单位不兼容，不猜测
 */

export type StockStatus =
  | { kind: 'sufficient' }
  | {
      kind: 'insufficient';
      needed: number;
      unit: InventoryUnit;
      /** true when recipe & inventory units differ (converted → approximate). */
      approximate: boolean;
    }
  | { kind: 'incompatible' }
  | { kind: 'not-in-stock' }
  | { kind: 'uncountable' };

/** Only accept plain numbers like "2" or "10.5". */
const NUMERIC_RE = /^\d+(?:\.\d+)?$/;

export function checkStock(
  ing: Ingredient,
  inventory: InventoryIngredient[]
): StockStatus {
  const amount = ing.amount.trim();
  if (!NUMERIC_RE.test(amount)) return { kind: 'uncountable' };

  const needed = parseFloat(amount);
  const item = inventory.find((i) => i.name.trim() === ing.name.trim());
  if (!item) return { kind: 'not-in-stock' };

  // Convert inventory quantity into the recipe's unit for comparison,
  // so any shortfall is naturally expressed in the recipe unit.
  const invInRecipeUnit = convertQuantity(item.quantity, item.unit, ing.unit);
  if (invInRecipeUnit === null) return { kind: 'incompatible' };

  if (invInRecipeUnit >= needed) return { kind: 'sufficient' };
  return {
    kind: 'insufficient',
    needed: needed - invInRecipeUnit,
    unit: ing.unit,
    approximate: ing.unit !== item.unit,
  };
}

export function stockStatusLabel(s: StockStatus): string {
  switch (s.kind) {
    case 'sufficient':
      return '🟢 库存充足';
    case 'insufficient':
      return `🟡 还需要${s.approximate ? '约 ' : ' '}${formatQuantity(s.needed)} ${s.unit}`;
    case 'incompatible':
      return '单位不兼容';
    case 'not-in-stock':
      return '库存中没有';
    case 'uncountable':
      return '无法计算库存';
  }
}
