import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { InventoryIngredient, Category } from '@/types';
import {
  loadInventory,
  saveInventory,
  loadIngredientCategories,
  INVENTORY_CHANGED_EVENT,
} from '@/utils/inventoryStorage';
import { syncDerived, withTotalQuantity, withEarliestExpiry } from '@/utils/batches';

/**
 * Inventory state hook. Follows the same ref-mirror + commit pattern
 * as useRecipes: mutations persist synchronously and commit() reports
 * whether localStorage actually accepted the write.
 */
export function useInventory() {
  const [items, setItems] = useState<InventoryIngredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsRef = useRef<InventoryIngredient[]>([]);

  const commit = useCallback((next: InventoryIngredient[]): boolean => {
    itemsRef.current = next;
    const persisted = saveInventory(next); // never throws
    setItems(next);
    return persisted;
  }, []);

  useEffect(() => {
    const initial = loadInventory();
    itemsRef.current = initial;
    setItems(initial);
    setCategories(loadIngredientCategories());
    setLoading(false);
  }, []);

  // Re-sync when inventory or ingredient categories change elsewhere
  useEffect(() => {
    const sync = () => {
      const next = loadInventory();
      itemsRef.current = next;
      setItems(next);
      setCategories(loadIngredientCategories());
    };
    window.addEventListener(INVENTORY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(INVENTORY_CHANGED_EVENT, sync);
  }, []);

  const updateItem = useCallback(
    (id: string, data: Partial<Omit<InventoryIngredient, 'id' | 'createdAt'>>): boolean => {
      const now = new Date().toISOString();
      return commit(
        itemsRef.current.map((i) =>
          i.id === id ? syncDerived({ ...i, ...data, updatedAt: now }) : i
        )
      );
    },
    [commit]
  );

  /** Home row inline edit: set a new total across batches (FIFO consume). */
  const setTotalQuantity = useCallback(
    (id: string, total: number): boolean => {
      const now = new Date().toISOString();
      return commit(
        itemsRef.current.map((i) =>
          i.id === id ? { ...withTotalQuantity(i, total), updatedAt: now } : i
        )
      );
    },
    [commit]
  );

  /** Home row inline edit: change the expiry of the nearest active batch. */
  const setEarliestExpiry = useCallback(
    (id: string, expiryDate: string | undefined): boolean => {
      const now = new Date().toISOString();
      return commit(
        itemsRef.current.map((i) =>
          i.id === id ? { ...withEarliestExpiry(i, expiryDate), updatedAt: now } : i
        )
      );
    },
    [commit]
  );

  const deleteItem = useCallback(
    (id: string): boolean => commit(itemsRef.current.filter((i) => i.id !== id)),
    [commit]
  );

  const getItemById = useCallback(
    (id: string): InventoryIngredient | undefined =>
      itemsRef.current.find((i) => i.id === id),
    []
  );

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? '未分类';
  }, [categories]);

  return {
    items,
    categories,
    loading,
    updateItem,
    setTotalQuantity,
    setEarliestExpiry,
    deleteItem,
    getItemById,
    categoryById: useMemo(
      () => new Map(categories.map((c) => [c.id, c])),
      [categories]
    ),
    categoryName,
  };
}
