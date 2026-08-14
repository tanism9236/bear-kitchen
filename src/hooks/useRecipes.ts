import { useState, useEffect, useCallback, useRef } from 'react';
import type { Recipe } from '@/types';
import {
  loadRecipes,
  saveRecipes,
  isInitialized,
  markInitialized,
  LIBRARY_CHANGED_EVENT,
} from '@/utils/storage';
import { createSampleRecipes } from '@/data/sampleRecipes';
import { generateId } from '@/utils/id';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  // Ref mirror of recipes so mutations can persist synchronously
  // (independent of React state lifecycle / unmount batching)
  const recipesRef = useRef<Recipe[]>([]);

  const commit = useCallback((next: Recipe[]) => {
    recipesRef.current = next;
    saveRecipes(next);
    setRecipes(next);
  }, []);

  useEffect(() => {
    let initial: Recipe[];
    if (!isInitialized()) {
      initial = createSampleRecipes();
      saveRecipes(initial);
      markInitialized();
    } else {
      initial = loadRecipes();
    }
    recipesRef.current = initial;
    setRecipes(initial);
    setLoading(false);
  }, []);

  // Re-sync when the tag/category library or recipes are mutated
  // outside this hook (e.g. tag rename/delete fixing up recipe refs).
  useEffect(() => {
    const sync = () => {
      const next = loadRecipes();
      recipesRef.current = next;
      setRecipes(next);
    };
    window.addEventListener(LIBRARY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, sync);
  }, []);

  const addRecipe = useCallback(
    (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Recipe => {
      const now = new Date().toISOString();
      const recipe: Recipe = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      commit([recipe, ...recipesRef.current]);
      return recipe;
    },
    [commit]
  );

  const updateRecipe = useCallback(
    (id: string, data: Partial<Omit<Recipe, 'id' | 'createdAt'>>): void => {
      commit(
        recipesRef.current.map((r) =>
          r.id === id
            ? { ...r, ...data, updatedAt: new Date().toISOString() }
            : r
        )
      );
    },
    [commit]
  );

  const deleteRecipe = useCallback(
    (id: string): void => {
      commit(recipesRef.current.filter((r) => r.id !== id));
    },
    [commit]
  );

  const getRecipeById = useCallback(
    (id: string): Recipe | undefined => recipesRef.current.find((r) => r.id === id),
    []
  );

  return { recipes, loading, addRecipe, updateRecipe, deleteRecipe, getRecipeById };
}
