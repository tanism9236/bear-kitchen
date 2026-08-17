import type { Plan } from '@/types';

const PLANS_KEY = 'bear-kitchen:plans';

// Broadcast event: fired whenever plans change outside a usePlans
// commit, so mounted hooks can re-sync.
export const PLANS_CHANGED_EVENT = 'bear-kitchen:plans-changed';

export function notifyPlansChanged(): void {
  window.dispatchEvent(new Event(PLANS_CHANGED_EVENT));
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[bear-kitchen] localStorage 写入失败 (${key}):`, error);
    return false;
  }
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function loadPlans(): Plan[] {
  try {
    const data = safeGetItem(PLANS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as Plan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Returns true if persisted, false if localStorage write failed. */
export function savePlans(plans: Plan[]): boolean {
  return safeSetItem(PLANS_KEY, JSON.stringify(plans));
}
