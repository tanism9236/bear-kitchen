import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRecipes } from '@/hooks/useRecipes';
import { useToast } from '@/components/Toast';
import { getTagById } from '@/utils/storage';
import { RecipeCover } from '@/components/RecipeCover';
import { TagChip } from '@/components/TagChip';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipes, deleteRecipe } = useRecipes();
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <div className="detail-not-found">
        <p className="detail-not-found-text">菜谱不存在</p>
        <Link to="/recipes" className="btn btn-primary">
          返回菜谱列表
        </Link>
      </div>
    );
  }

  const tags = recipe.tags
    .map((tid) => getTagById(tid))
    .filter((t): t is NonNullable<typeof t> => !!t);

  const handleDelete = () => {
    deleteRecipe(recipe.id);
    showToast('菜谱已删除');
    navigate('/recipes');
  };

  return (
    <div className="recipe-detail-page">
      {/* Top Bar */}
      <div className="detail-topbar">
        <button className="btn btn-ghost" onClick={() => navigate('/recipes')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          菜谱
        </button>
        <div className="detail-topbar-actions">
          <Link to={`/recipes/${recipe.id}/edit`} className="btn btn-secondary btn-sm">
            编辑
          </Link>
          <button
            className="btn btn-ghost btn-sm detail-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            删除
          </button>
        </div>
      </div>

      <div className="detail-content">
        {/* Cover */}
        <RecipeCover
          image={recipe.coverImage}
          name={recipe.name}
          className="detail-cover"
        />

        {/* Title */}
        <h1 className="detail-name">{recipe.name}</h1>

        {/* Tags (同一排) */}
        {tags.length > 0 && (
          <div className="detail-tags-inline">
            {tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} size="md" />
            ))}
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">食材</h2>
            <ul className="detail-ingredients">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="detail-ingredient-item">
                  <span className="detail-ingredient-name">{ing.name}</span>
                  <span className="detail-ingredient-amount">
                    {ing.amount} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section-title">步骤</h2>
            <ol className="detail-steps">
              {recipe.steps.map((step, index) => (
                <li key={step.id} className="detail-step-item">
                  <span className="detail-step-number">{index + 1}</span>
                  <span className="detail-step-text">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Footer info */}
        <div className="detail-footer-info">
          <span>创建于 {new Date(recipe.createdAt).toLocaleDateString('zh-CN')}</span>
          {recipe.updatedAt !== recipe.createdAt && (
            <span>
              · 更新于 {new Date(recipe.updatedAt).toLocaleDateString('zh-CN')}
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除菜谱"
        message="确定要删除这道菜谱吗？"
        confirmText="删除"
        cancelText="取消"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
