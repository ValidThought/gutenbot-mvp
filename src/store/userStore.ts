import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile, BundeslandCode, Address } from '@/types';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateBundesland: (code: BundeslandCode) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isOnboarded: false,
      setProfile: (profile) => set({ profile, isOnboarded: true }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
      updateBundesland: (code) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, bundesland: code } : null,
        })),
      reset: () => set({ profile: null, isOnboarded: false }),
    }),
    {
      name: 'gutenbot-user',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function createMockUser(overrides: Partial<UserProfile> = {}): UserProfile {
  const defaultAddress: Address = {
    street: 'Hauptstraße 1',
    zip: '10115',
    city: 'Berlin',
  };

  return {
    id: 'test-user-1',
    name: 'Hans Müller',
    address: defaultAddress,
    bundesland: 'BE',
    email: 'hans@example.de',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
