import type { Tag } from '@/types';
import { TAG_DIMENSION_COLORS } from '@/data/tags';

interface TagChipProps {
  tag: Tag;
  size?: 'sm' | 'md';
}

export function TagChip({ tag, size = 'sm' }: TagChipProps) {
  const colors = TAG_DIMENSION_COLORS[tag.dimension] || TAG_DIMENSION_COLORS.custom;
  return (
    <span
      className={`tag-chip ${size === 'sm' ? 'tag-chip-sm' : ''}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {tag.name}
    </span>
  );
}
