import type { Ingredient } from '@/types';
import { generateId } from '@/utils/id';
import { DEFAULT_INVENTORY_UNITS } from '@/types';

interface IngredientEditorProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

export function IngredientEditor({ ingredients, onChange }: IngredientEditorProps) {
  const add = () => {
    onChange([
      ...ingredients,
      { id: generateId(), name: '', amount: '', unit: '' },
    ]);
  };

  const update = (id: string, field: keyof Omit<Ingredient, 'id'>, value: string) => {
    onChange(
      ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const remove = (id: string) => {
    onChange(ingredients.filter((ing) => ing.id !== id));
  };

  return (
    <div className="ingredient-editor">
      {ingredients.map((ing) => (
        <div key={ing.id} className="ingredient-row animate-fadeIn">
          <input
            type="text"
            className="ing-input ing-input-name"
            placeholder="鸡蛋"
            value={ing.name}
            onChange={(e) => update(ing.id, 'name', e.target.value)}
          />
          <input
            type="text"
            inputMode="decimal"
            className="ing-input ing-input-amount"
            placeholder="3"
            value={ing.amount}
            onChange={(e) => update(ing.id, 'amount', e.target.value)}
          />
          <div className="ing-unit-wrap">
            <select
              className="ing-input ing-input-unit"
              value={ing.unit}
              onChange={(e) => update(ing.id, 'unit', e.target.value)}
            >
              <option value="">单位</option>
              {DEFAULT_INVENTORY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <svg className="ing-unit-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <button
            type="button"
            className="ing-remove"
            onClick={() => remove(ing.id)}
            title="删除"
            aria-label="删除"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
      <button type="button" className="pill-add-btn" onClick={add}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        添加食材
      </button>
    </div>
  );
}