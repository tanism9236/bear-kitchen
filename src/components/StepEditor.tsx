import { useState, type DragEvent } from 'react';
import type { RecipeStep } from '@/types';
import { generateId } from '@/utils/id';

interface StepEditorProps {
  steps: RecipeStep[];
  onChange: (steps: RecipeStep[]) => void;
}

export function StepEditor({ steps, onChange }: StepEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const add = () => {
    onChange([...steps, { id: generateId(), text: '' }]);
  };

  const update = (id: string, text: string) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  const remove = (id: string) => {
    onChange(steps.filter((s) => s.id !== id));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && index !== dragIndex) {
      setOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setOverIndex(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...steps];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="step-editor">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`step-row animate-fadeIn${dragIndex === index ? ' step-row-dragging' : ''}${overIndex === index && dragIndex !== null && dragIndex !== index ? ' step-row-drag-over' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <div className="step-drag-handle" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="step-number">{index + 1}</div>
          <textarea
            className="step-textarea"
            placeholder={`描述步骤 ${index + 1}…`}
            value={step.text}
            onChange={(e) => update(step.id, e.target.value)}
            rows={2}
          />
          <button
            type="button"
            className="step-remove"
            onClick={() => remove(step.id)}
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
        添加步骤
      </button>
    </div>
  );
}
