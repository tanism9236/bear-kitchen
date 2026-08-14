import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecipes } from '@/hooks/useRecipes';
import { useToast } from '@/components/Toast';
import { CategorySelector } from '@/components/CategorySelector';
import { CoverImageUploader } from '@/components/CoverImageUploader';
import { TagSelector } from '@/components/TagSelector';
import { IngredientEditor } from '@/components/IngredientEditor';
import { StepEditor } from '@/components/StepEditor';
import type { Ingredient, RecipeStep } from '@/types';
import { generateId } from '@/utils/id';

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { recipes, addRecipe, updateRecipe } = useRecipes();
  const { showToast } = useToast();

  const existingRecipe = isEdit ? recipes.find((r) => r.id === id) : undefined;

  const [name, setName] = useState(existingRecipe?.name ?? '');
  const [coverImage, setCoverImage] = useState<string | null>(
    existingRecipe?.coverImage ?? null
  );
  const [category, setCategory] = useState(existingRecipe?.category ?? '');
  const [tags, setTags] = useState<string[]>(existingRecipe?.tags ?? []);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    existingRecipe?.ingredients ?? [
      { id: generateId(), name: '', amount: '', unit: '' },
    ]
  );
  const [steps, setSteps] = useState<RecipeStep[]>(
    existingRecipe?.steps ?? [{ id: generateId(), text: '' }]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If editing but recipe not found
  if (isEdit && !existingRecipe) {
    return (
      <div className="form-not-found">
        <p>菜谱不存在</p>
        <button className="btn btn-primary" onClick={() => navigate('/recipes')}>
          返回菜谱列表
        </button>
      </div>
    );
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '请输入菜名';
    if (!category) errs.category = '请选择分类';
    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) errs.ingredients = '请至少添加一种食材';
    const validSteps = steps.filter((s) => s.text.trim());
    if (validSteps.length === 0) errs.steps = '请至少添加一个步骤';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      showToast('请完善必填信息', 'error');
      return;
    }

    const cleanIngredients = ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        id: i.id,
        name: i.name.trim(),
        amount: i.amount.trim(),
        unit: i.unit.trim(),
      }));

    const cleanSteps = steps
      .filter((s) => s.text.trim())
      .map((s) => ({ id: s.id, text: s.text.trim() }));

    const data = {
      name: name.trim(),
      coverImage,
      category,
      tags,
      ingredients: cleanIngredients,
      steps: cleanSteps,
    };

    if (isEdit && id) {
      updateRecipe(id, data);
      showToast('菜谱已更新');
      navigate(`/recipes/${id}`);
    } else {
      const recipe = addRecipe(data);
      showToast('菜谱已添加');
      navigate(`/recipes/${recipe.id}`);
    }
  };

  return (
    <div className="recipe-form-page">
      {/* Form Header */}
      <div className="form-header">
        <button
          className="btn btn-ghost"
          onClick={() => navigate(isEdit ? `/recipes/${id}` : '/recipes')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          返回
        </button>
        <h1 className="form-title">{isEdit ? '编辑菜谱' : '添加菜谱'}</h1>
        <button className="btn btn-primary form-save-btn" onClick={handleSave}>
          保存菜谱
        </button>
      </div>

      <div className="form-body">
        {/* Cover Image */}
        <div className="form-section">
          <label className="form-label">封面图片</label>
          <CoverImageUploader value={coverImage} onChange={setCoverImage} />
        </div>

        {/* Name */}
        <div className="form-section">
          <label className="form-label">
            菜名 <span className="form-required">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="如：番茄炒蛋"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        {/* Category */}
        <div className="form-section">
          <label className="form-label">
            分类 <span className="form-required">*</span>
          </label>
          <div>
            <CategorySelector selected={category} onChange={setCategory} />
          </div>
          {errors.category && <p className="form-error">{errors.category}</p>}
        </div>

        {/* Tags */}
        <div className="form-section">
          <label className="form-label">标签</label>
          <TagSelector selectedTags={tags} onChange={setTags} />
        </div>

        {/* Ingredients */}
        <div className="form-section">
          <label className="form-label">
            食材 <span className="form-required">*</span>
          </label>
          <IngredientEditor ingredients={ingredients} onChange={setIngredients} />
          {errors.ingredients && <p className="form-error">{errors.ingredients}</p>}
        </div>

        {/* Steps */}
        <div className="form-section">
          <label className="form-label">
            步骤 <span className="form-required">*</span>
          </label>
          <StepEditor steps={steps} onChange={setSteps} />
          {errors.steps && <p className="form-error">{errors.steps}</p>}
        </div>

        {/* Bottom Save Button (mobile-friendly) */}
        <div className="form-bottom-actions">
          <button
            className="btn btn-secondary btn-block"
            onClick={() => navigate(isEdit ? `/recipes/${id}` : '/recipes')}
          >
            取消
          </button>
          <button className="btn btn-primary btn-block" onClick={handleSave}>
            保存菜谱
          </button>
        </div>
      </div>
    </div>
  );
}
