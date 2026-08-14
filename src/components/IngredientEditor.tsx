import type { Ingredient } from '@/types';
import { generateId } from '@/utils/id';

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
      {ingredients.length > 0 && (
        <div className="ingredient-editor-header">
          <span className="ingredient-col-name">食材名称</span>
          <span className="ingredient-col-amount">数量</span>
          <span className="ingredient-col-unit">单位</span>
          <span className="ingredient-col-action" />
        </div>
      )}
      {ingredients.map((ing) => (
        <div key={ing.id} className="ingredient-row animate-fadeIn">
          <input
            type="text"
            className="input ingredient-input-name"
            placeholder="如：鸡蛋"
            value={ing.name}
            onChange={(e) => update(ing.id, 'name', e.target.value)}
          />
          <input
            type="text"
            className="input ingredient-input-amount"
            placeholder="如：3"
            value={ing.amount}
            onChange={(e) => update(ing.id, 'amount', e.target.value)}
          />
          <input
            type="text"
            className="input ingredient-input-unit"
            placeholder="如：个"
            value={ing.unit}
            onChange={(e) => update(ing.id, 'unit', e.target.value)}
          />
          <button
            type="button"
            className="ingredient-remove"
            onClick={() => remove(ing.id)}
            title="删除"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-secondary ingredient-add" onClick={add}>
        + 添加食材
      </button>
    </div>
  );
}
