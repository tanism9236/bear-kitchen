import { useState, useEffect, useCallback, useRef } from 'react';
import type { Meal, Plan, PlanType } from '@/types';
import {
  loadPlans,
  savePlans,
  PLANS_CHANGED_EVENT,
} from '@/utils/planStorage';
import { generateId } from '@/utils/id';

/**
 * Plan state hook. Follows the same ref-mirror + commit pattern
 * as useRecipes / useInventory / useMembers.
 */
export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const plansRef = useRef<Plan[]>([]);

  const commit = useCallback((next: Plan[]): boolean => {
    plansRef.current = next;
    const persisted = savePlans(next); // never throws
    setPlans(next);
    return persisted;
  }, []);

  useEffect(() => {
    const initial = loadPlans();
    plansRef.current = initial;
    setPlans(initial);
    setLoading(false);
  }, []);

  // Re-sync when plans change elsewhere
  useEffect(() => {
    const sync = () => {
      const next = loadPlans();
      plansRef.current = next;
      setPlans(next);
    };
    window.addEventListener(PLANS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PLANS_CHANGED_EVENT, sync);
  }, []);

  const getPlanById = useCallback(
    (id: string | undefined): Plan | undefined =>
      id ? plansRef.current.find((p) => p.id === id) : undefined,
    []
  );

  const addPlan = useCallback(
    (data: Pick<Plan, 'type' | 'title' | 'startDate'> &
      Partial<Pick<Plan, 'endDate' | 'memberIds'>>): Plan => {
      const now = new Date().toISOString();
      const plan: Plan = {
        meals: [],
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      commit([...plansRef.current, plan]);
      return plan;
    },
    [commit]
  );

  const updatePlan = useCallback(
    (id: string, data: Partial<Omit<Plan, 'id' | 'createdAt'>>): boolean => {
      const now = new Date().toISOString();
      return commit(
        plansRef.current.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: now } : p
        )
      );
    },
    [commit]
  );

  const deletePlan = useCallback(
    (id: string): boolean =>
      commit(plansRef.current.filter((p) => p.id !== id)),
    [commit]
  );

  /** Replace a meal inside a plan (add/update/delete all go through here). */
  const setMeal = useCallback(
    (planId: string, meal: Meal): boolean => {
      const now = new Date().toISOString();
      return commit(
        plansRef.current.map((p) => {
          if (p.id !== planId) return p;
          const exists = p.meals.some((m) => m.id === meal.id);
          return {
            ...p,
            meals: exists
              ? p.meals.map((m) => (m.id === meal.id ? meal : m))
              : [...p.meals, meal],
            updatedAt: now,
          };
        })
      );
    },
    [commit]
  );

  const removeMeal = useCallback(
    (planId: string, mealId: string): boolean => {
      const now = new Date().toISOString();
      return commit(
        plansRef.current.map((p) =>
          p.id === planId
            ? {
                ...p,
                meals: p.meals.filter((m) => m.id !== mealId),
                updatedAt: now,
              }
            : p
        )
      );
    },
    [commit]
  );

  return {
    plans,
    loading,
    getPlanById,
    addPlan,
    updatePlan,
    deletePlan,
    setMeal,
    removeMeal,
  };
}

/** Helper: build default plan title by type. */
export function defaultPlanTitle(
  type: PlanType,
  startDate: string,
  endDate?: string
): string {
  const s = startDate.replace(/-/g, '/');
  if (type === 'weekly' && endDate) {
    const e = endDate.slice(5).replace(/-/g, '/');
    return `${s.slice(5)}-${e} 家庭饮食计划`;
  }
  if (type === 'daily') return `${s.slice(5)} 饮食计划`;
  return '';
}
