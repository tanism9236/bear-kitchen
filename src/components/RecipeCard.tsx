import { Link } from 'react-router-dom';
import type { Recipe } from '@/types';
import { getCategoryName, getTagById } from '@/utils/storage';
import { RecipeCover } from './RecipeCover';
import { TagChip } from './TagChip';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const tags = recipe.tags
    .map((id) => getTagById(id))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .slice(0, 4);

  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card animate-slideUp">
      <div className="recipe-card-cover">
        <RecipeCover image={recipe.coverImage} name={recipe.name} />
        <span className="recipe-card-category-badge">
          {getCategoryName(recipe.category)}
        </span>
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-name">{recipe.name}</h3>
        {tags.length > 0 && (
          <div className="recipe-card-tags">
            {tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
