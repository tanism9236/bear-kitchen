import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecipes } from '@/hooks/useRecipes';
import { useToast } from '@/components/Toast';
import { BackButton } from '@/components/BackButton';
import { useAppNav } from '@/navigation/NavigationProvider';
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
  const { goBack } = useAppNav();
  const { recipes, loading, addRecipe, updateRecipe } = useRecipes();
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

  // Backfill form fields when recipe data arrives asynchronously
  // (useRecipes loads from localStorage in useEffect, so on first render
  //  recipes is [] and existingRecipe is undefined — useState initializers
  //  capture empty values. This effect re-populates once data is ready.)
  useEffect(() => {
    if (isEdit && existingRecipe) {
      setName(existingRecipe.name);
      setCoverImage(existingRecipe.coverImage);
      setCategory(existingRecipe.category);
      setTags(existingRecipe.tags);
      setIngredients(existingRecipe.ingredients);
      setSteps(existingRecipe.steps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existingRecipe?.id]);

  // Show loading while recipes are being fetched from storage
  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  // If editing but recipe not found (after loading is complete)
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
    if (tags.length === 0) errs.tags = '请至少选择一个标签';
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
      // replace 回详情页：导航栈自动截断回原详情层，返回行为保持不变
      navigate(`/recipes/${id}`, { replace: true });
    } else {
      const recipe = addRecipe(data);
      showToast('菜谱已添加');
      navigate(`/recipes/${recipe.id}`, { replace: true });
    }
  };

  return (
    <div className="recipe-form-page">
      {/* Form Header (matching RecipeDetailPage topbar) */}
      <div className="form-header">
        <BackButton />
        <button className="btn btn-secondary btn-sm form-save-btn" onClick={handleSave}>
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
          <label className="form-label">标签 <span className="form-required">*</span></label>
          <TagSelector selectedTags={tags} onChange={setTags} />
          {errors.tags && <p className="form-error">{errors.tags}</p>}
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
            type="button"
            className="form-pill-btn form-pill-btn-cancel"
            onClick={() => goBack('/recipes')}
          >
            取消
          </button>
          <button
            type="button"
            className="form-pill-btn form-pill-btn-save"
            onClick={handleSave}
          >
            保存菜谱
          </button>
        </div>
      </div>
    </div>
  );
}
