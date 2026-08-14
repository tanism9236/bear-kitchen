interface RecipeCoverProps {
  image: string | null;
  name: string;
  category?: string;
  className?: string;
}

// Deterministic gradient from recipe name
function getGradient(name: string): string {
  const palettes = [
    ['#F5E6D3', '#E8C9A8'],
    ['#F0DDD0', '#D9A5A0'],
    ['#E8DFCC', '#C9B89A'],
    ['#F0E4D4', '#D4B896'],
    ['#EAE0D5', '#C9A88A'],
    ['#F2E0D3', '#DFAF8E'],
    ['#E5DCC8', '#C8B487'],
    ['#F0DCC8', '#D8B080'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = palettes[Math.abs(hash) % palettes.length];
  return `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
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
    <div
      className={`recipe-cover recipe-cover-placeholder ${className}`}
      style={{ background: getGradient(name) }}
    >
      <span className="recipe-cover-emoji">🍽️</span>
    </div>
  );
}
