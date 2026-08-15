interface RecipeCoverProps {
  image: string | null;
  name: string;
  category?: string;
  className?: string;
}

export function RecipeCover({ image, name, className = '' }: RecipeCoverProps) {
  if (image) {
    return (
      <div className={`recipe-cover ${className}`}>
        <img src={image} alt={name} className="recipe-cover-img" />
      </div>
    );
  }

  return (
    <div className={`recipe-cover recipe-cover-placeholder ${className}`}>
      <span className="recipe-cover-emoji">🍽️</span>
    </div>
  );
}
