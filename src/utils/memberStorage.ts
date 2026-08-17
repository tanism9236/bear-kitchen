import type { Member } from '@/types';
import { generateId } from '@/utils/id';

const MEMBERS_KEY = 'bear-kitchen:members';

// Broadcast event: fired whenever members change outside a useMembers
// commit, so mounted hooks can re-sync.
export const MEMBERS_CHANGED_EVENT = 'bear-kitchen:members-changed';

export function notifyMembersChanged(): void {
  window.dispatchEvent(new Event(MEMBERS_CHANGED_EVENT));
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

/** Default Owner member, seeded on first visit. */
export function createOwnerMember(): Member {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: 'Tan',
    role: 'Owner',
    gender: 'female',
    age: 0,
    height: 0,
    weight: 0,
    activityLevel: 'moderate',
    nutritionGoal: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

export function loadMembers(): Member[] {
  try {
    const data = safeGetItem(MEMBERS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as Member[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Returns true if persisted, false if localStorage write failed. */
export function saveMembers(members: Member[]): boolean {
  return safeSetItem(MEMBERS_KEY, JSON.stringify(members));
}

/**
 * Load members, seeding the default Owner on first visit.
 * Seed is only persisted when the write succeeds, so a storage failure
 * doesn't get mistaken for "user deleted everyone".
 */
export function loadMembersWithSeed(): Member[] {
  const existing = loadMembers();
  if (existing.length > 0) return existing;
  const seeded = [createOwnerMember()];
  if (saveMembers(seeded)) return seeded;
  return seeded;
}
