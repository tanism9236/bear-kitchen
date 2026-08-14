import type { TagGroup } from '@/types';

export const TAG_GROUPS: TagGroup[] = [
  {
    dimension: 'cuisine',
    label: '菜系',
    tags: ['中餐', '日料', '韩餐', '泰餐', '越南菜', '意餐', '法餐', '美式', '墨西哥菜'],
  },
  {
    dimension: 'ingredient',
    label: '主食材',
    tags: ['猪肉', '牛肉', '鸡肉', '羊肉', '鱼', '虾', '贝类', '蛋类', '豆制品', '蔬菜'],
  },
  {
    dimension: 'flavor',
    label: '口味',
    tags: ['咸鲜', '酸', '甜', '辣', '酸辣', '麻辣', '清淡', '浓郁'],
  },
  {
    dimension: 'method',
    label: '烹饪方式',
    tags: ['炒', '煎', '炸', '蒸', '煮', '炖', '烤', '焖', '卤', '拌'],
  },
];

export const TAG_DIMENSION_LABELS: Record<string, string> = {
  cuisine: '菜系',
  ingredient: '主食材',
  flavor: '口味',
  method: '烹饪方式',
  custom: '自定义',
};

export const TAG_DIMENSION_COLORS: Record<string, { bg: string; text: string }> = {
  cuisine: { bg: 'var(--tag-cuisine-bg)', text: 'var(--tag-cuisine-text)' },
  ingredient: { bg: 'var(--tag-ingredient-bg)', text: 'var(--tag-ingredient-text)' },
  flavor: { bg: 'var(--tag-flavor-bg)', text: 'var(--tag-flavor-text)' },
  method: { bg: 'var(--tag-method-bg)', text: 'var(--tag-method-text)' },
  custom: { bg: 'var(--tag-custom-bg)', text: 'var(--tag-custom-text)' },
};
