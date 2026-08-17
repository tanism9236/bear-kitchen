import { useState, useEffect, useCallback, useRef } from 'react';
import type { Member } from '@/types';
import {
  loadMembersWithSeed,
  saveMembers,
  MEMBERS_CHANGED_EVENT,
} from '@/utils/memberStorage';
import { generateId } from '@/utils/id';

/**
 * Family member state hook. Follows the same ref-mirror + commit
 * pattern as useRecipes / useInventory.
 */
export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const membersRef = useRef<Member[]>([]);

  const commit = useCallback((next: Member[]): boolean => {
    membersRef.current = next;
    const persisted = saveMembers(next); // never throws
    setMembers(next);
    return persisted;
  }, []);

  useEffect(() => {
    const initial = loadMembersWithSeed();
    membersRef.current = initial;
    setMembers(initial);
    setLoading(false);
  }, []);

  // Re-sync when members change elsewhere
  useEffect(() => {
    const sync = () => {
      const next = loadMembersWithSeed();
      membersRef.current = next;
      setMembers(next);
    };
    window.addEventListener(MEMBERS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(MEMBERS_CHANGED_EVENT, sync);
  }, []);

  const addMember = useCallback(
    (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Member => {
      const now = new Date().toISOString();
      const member: Member = { ...data, id: generateId(), createdAt: now, updatedAt: now };
      commit([...membersRef.current, member]);
      return member;
    },
    [commit]
  );

  const updateMember = useCallback(
    (id: string, data: Partial<Omit<Member, 'id' | 'createdAt'>>): boolean => {
      const now = new Date().toISOString();
      return commit(
        membersRef.current.map((m) =>
          m.id === id ? { ...m, ...data, updatedAt: now } : m
        )
      );
    },
    [commit]
  );

  const deleteMember = useCallback(
    (id: string): boolean =>
      commit(membersRef.current.filter((m) => m.id !== id)),
    [commit]
  );

  return { members, loading, addMember, updateMember, deleteMember };
}
