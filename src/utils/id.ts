/**
 * Generate a unique ID.
 * Uses crypto.randomUUID if available, falls back to timestamp + random.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Generate a deterministic tag ID from name + dimension.
 * Used for default (non-custom) tags so they have stable IDs.
 */
export function tagId(name: string, dimension: string): string {
  return `${dimension}:${name}`;
}
