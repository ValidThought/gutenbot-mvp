import { create } from 'zustand';
import type { Letter, LetterStatus, LetterClassification, LetterAnalysis } from '@/types';

interface OCRResult {
  text: string;
  confidence: number;
  wordCount: number;
}

interface LetterState {
  currentLetter: Letter | null;
  ocrResult: OCRResult | null;
  isProcessing: boolean;
  error: string | null;
  setCurrentLetter: (letter: Letter) => void;
  setOcrResult: (result: OCRResult) => void;
  setClassification: (classification: LetterClassification) => void;
  setAnalysis: (analysis: LetterAnalysis) => void;
  updateStatus: (status: LetterStatus) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLetterStore = create<LetterState>((set) => ({
  currentLetter: null,
  ocrResult: null,
  isProcessing: false,
  error: null,
  setCurrentLetter: (letter) => set({ currentLetter: letter, error: null }),
  setOcrResult: (result) => set({ ocrResult: result }),
  setClassification: (classification) =>
    set((state) => ({
      currentLetter: state.currentLetter
        ? { ...state.currentLetter, classification, status: 'analyzed' as LetterStatus }
        : null,
    })),
  setAnalysis: (analysis) =>
    set((state) => ({
      currentLetter: state.currentLetter
        ? { ...state.currentLetter, analysis, status: 'analyzed' as LetterStatus }
        : null,
    })),
  updateStatus: (status) =>
    set((state) => ({
      currentLetter: state.currentLetter
        ? { ...state.currentLetter, status }
        : null,
    })),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error, isProcessing: false }),
  reset: () => set({ currentLetter: null, ocrResult: null, isProcessing: false, error: null }),
}));

export function createMockLetter(overrides: Partial<Letter> = {}): Letter {
  const defaultClassification: LetterClassification = {
    category: 'BESCHEID',
    confidence: 0.95,
    sender: {
      name: 'Finanzamt Berlin',
      type: 'government',
      jurisdiction: 'BE',
    },
    subject: 'Einkommensteuerbescheid 2024',
    deadlines: [],
  };

  const defaultAnalysis: LetterAnalysis = {
    summary: 'Das Finanzamt hat einen Einkommensteuerbescheid für 2024 erlassen.',
    keyPoints: [
      'Bescheid vom 15.01.2025',
      'Widerspruchsfrist: 30 Tage',
    ],
    legalBasis: [],
    recommendedActions: [],
    risks: [],
  };

  return {
    id: 'test-letter-1',
    userId: 'test-user-1',
    imageUrl: '/test-letter.jpg',
    extractedText: 'Einkommensteuerbescheid 2024...',
    ocrConfidence: 0.92,
    classification: defaultClassification,
    analysis: defaultAnalysis,
    status: 'uploaded',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
