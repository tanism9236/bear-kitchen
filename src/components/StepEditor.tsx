import type { RecipeStep } from '@/types';
import { generateId } from '@/utils/id';

interface StepEditorProps {
  steps: RecipeStep[];
  onChange: (steps: RecipeStep[]) => void;
}

export function StepEditor({ steps, onChange }: StepEditorProps) {
  const add = () => {
    onChange([...steps, { id: generateId(), text: '' }]);
  };

  const update = (id: string, text: string) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  const remove = (id: string) => {
    onChange(steps.filter((s) => s.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...steps];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const next = [...steps];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div className="step-editor">
      {steps.map((step, index) => (
        <div key={step.id} className="step-row animate-fadeIn">
          <div className="step-number">{index + 1}</div>
          <textarea
            className="textarea step-textarea"
            placeholder={`描述步骤 ${index + 1}…`}
            value={step.text}
            onChange={(e) => update(step.id, e.target.value)}
            rows={2}
          />
          <div className="step-actions">
            <button
              type="button"
              className="step-action-btn"
              onClick={() => moveUp(index)}
              disabled={index === 0}
              title="上移"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="step-action-btn"
              onClick={() => moveDown(index)}
              disabled={index === steps.length - 1}
              title="下移"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="step-action-btn step-action-delete"
              onClick={() => remove(step.id)}
              title="删除"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-secondary step-add" onClick={add}>
        + 添加步骤
      </button>
    </div>
  );
}
