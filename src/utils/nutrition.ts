import type { ActivityLevel, Gender, NutritionGoal } from '@/types';

/**
 * Simple nutrition recommendation (Mifflin-St Jeor + activity factor).
 * Deliberately simple — V2.5 only needs a reasonable starting point the
 * user can then edit manually.
 *
 * BMR:
 *   male:   10*kg + 6.25*cm - 5*age + 5
 *   female: 10*kg + 6.25*cm - 5*age - 161
 * TDEE = BMR × activity factor.
 * Macros: protein 25% / carbs 45% / fat 30% of calories
 * (protein & carbs 4 kcal/g, fat 9 kcal/g).
 */

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: '久坐少动',
  light: '轻度活动',
  moderate: '中度活动',
  active: '高强度活动',
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: '男',
  female: '女',
};

/** Returns null when basic info is incomplete or invalid. */
export function calcBMR(
  gender: Gender,
  age: number,
  height: number,
  weight: number
): number | null {
  if (!(age > 0) || !(height > 0) || !(weight > 0)) return null;
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

/** Recommended daily goal from basic info. Null if info incomplete. */
export function recommendNutritionGoal(
  gender: Gender,
  age: number,
  height: number,
  weight: number,
  activityLevel: ActivityLevel
): NutritionGoal | null {
  const bmr = calcBMR(gender, age, height, weight);
  if (bmr === null) return null;
  const calories = Math.round(bmr * ACTIVITY_FACTOR[activityLevel]);
  return {
    calories,
    protein: Math.round((calories * 0.25) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}
