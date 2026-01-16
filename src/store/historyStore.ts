import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Letter } from '@/types';
import { createMockLetter } from './letterStore';

interface HistoryState {
  letters: Letter[];
  addLetter: (letter: Letter) => void;
  updateLetter: (id: string, updates: Partial<Letter>) => void;
  getLetter: (id: string) => Letter | undefined;
  getLettersByStatus: (status: Letter['status']) => Letter[];
  deleteLetter: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      letters: [],
      addLetter: (letter) =>
        set((state) => ({
          letters: [letter, ...state.letters],
        })),
      updateLetter: (id, updates) =>
        set((state) => ({
          letters: state.letters.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l
          ),
        })),
      getLetter: (id) => get().letters.find((l) => l.id === id),
      getLettersByStatus: (status) =>
        get().letters.filter((l) => l.status === status),
      deleteLetter: (id) =>
        set((state) => ({
          letters: state.letters.filter((l) => l.id !== id),
        })),
      clearHistory: () => set({ letters: [] }),
    }),
    {
      name: 'gutenbot-history',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function seedMockHistory(): Letter[] {
  const letters: Letter[] = [
    createMockLetter({
      id: 'history-1',
      status: 'completed',
      classification: {
        ...createMockLetter().classification,
        category: 'BESCHEID',
        subject: 'Einkommensteuerbescheid 2024',
      },
    }),
    createMockLetter({
      id: 'history-2',
      status: 'response_sent',
      classification: {
        ...createMockLetter().classification,
        category: 'MAHNUNG',
        subject: 'Mahnung Rundfunkbeitrag',
      },
    }),
    createMockLetter({
      id: 'history-3',
      status: 'analyzed',
      classification: {
        ...createMockLetter().classification,
        category: 'ANHOERUNG',
        subject: 'Anhörung Bußgeldverfahren',
      },
    }),
  ];

  return letters;
}
