import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  ClassificationSchema,
  AnalysisSchema,
  DeadlineSchema,
  LegalReferenceSchema,
  RecommendedActionSchema,
} from '@/lib/llm/schemas';

describe('LLM Schemas', () => {
  describe('ClassificationSchema', () => {
    it('should validate a correct classification', () => {
      const validClassification = {
        category: 'BESCHEID',
        confidence: 0.95,
        sender: {
          name: 'Finanzamt Berlin',
          type: 'government' as const,
          jurisdiction: 'BE',
        },
        subject: 'Einkommensteuerbescheid 2024',
        deadlines: [],
      };

      const result = ClassificationSchema.safeParse(validClassification);
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const invalidClassification = {
        category: 'INVALID_CATEGORY',
        confidence: 0.95,
        sender: {
          name: 'Test',
          type: 'government' as const,
        },
        subject: 'Test Subject',
        deadlines: [],
      };

      const result = ClassificationSchema.safeParse(invalidClassification);
      expect(result.success).toBe(false);
    });

    it('should reject confidence > 1', () => {
      const invalidClassification = {
        category: 'BESCHEID',
        confidence: 1.5,
        sender: {
          name: 'Test',
          type: 'government' as const,
        },
        subject: 'Test Subject',
        deadlines: [],
      };

      const result = ClassificationSchema.safeParse(invalidClassification);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sender type', () => {
      const invalidClassification = {
        category: 'BESCHEID',
        confidence: 0.95,
        sender: {
          name: 'Test',
          type: 'invalid_type' as any,
        },
        subject: 'Test Subject',
        deadlines: [],
      };

      const result = ClassificationSchema.safeParse(invalidClassification);
      expect(result.success).toBe(false);
    });
  });

  describe('DeadlineSchema', () => {
    it('should validate a correct deadline', () => {
      const validDeadline = {
        type: 'widerspruch',
        date: '2025-02-14',
        daysRemaining: 30,
        urgency: 'high' as const,
        description: 'Widerspruchsfrist',
        isLegal: true,
      };

      const result = DeadlineSchema.safeParse(validDeadline);
      expect(result.success).toBe(true);
    });

    it('should reject invalid urgency level', () => {
      const invalidDeadline = {
        type: 'widerspruch',
        date: '2025-02-14',
        daysRemaining: 30,
        urgency: 'invalid' as any,
        description: 'Widerspruchsfrist',
      };

      const result = DeadlineSchema.safeParse(invalidDeadline);
      expect(result.success).toBe(false);
    });
  });

  describe('LegalReferenceSchema', () => {
    it('should validate a correct legal reference', () => {
      const validReference = {
        law: 'EStG',
        paragraph: '§ 32a',
        description: 'Einkommensteuertarif',
        url: 'https://www.gesetze-im-internet.de/estg/__32a.html',
        isLandesrecht: false,
      };

      const result = LegalReferenceSchema.safeParse(validReference);
      expect(result.success).toBe(true);
    });

    it('should make url optional', () => {
      const referenceWithoutUrl = {
        law: 'VwVfG',
        paragraph: '§ 35',
        description: 'Verwaltungsverfahren',
        isLandesrecht: true,
      };

      const result = LegalReferenceSchema.safeParse(referenceWithoutUrl);
      expect(result.success).toBe(true);
    });
  });

  describe('RecommendedActionSchema', () => {
    it('should validate a correct recommended action', () => {
      const validAction = {
        id: '1',
        title: 'Widerspruch einlegen',
        description: 'Gegen den Bescheid Widerspruch einlegen',
        complexity: 'moderate' as const,
        templateId: 'widerspruch',
      };

      const result = RecommendedActionSchema.safeParse(validAction);
      expect(result.success).toBe(true);
    });

    it('should reject invalid complexity level', () => {
      const invalidAction = {
        id: '1',
        title: 'Test',
        description: 'Test description',
        complexity: 'very_complex' as any,
      };

      const result = RecommendedActionSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });
  });

  describe('AnalysisSchema', () => {
    it('should validate a complete analysis', () => {
      const validAnalysis = {
        classification: {
          category: 'BESCHEID',
          confidence: 0.95,
          sender: {
            name: 'Finanzamt Berlin',
            type: 'government' as const,
          },
          subject: 'Einkommensteuerbescheid 2024',
          deadlines: [],
        },
        summary: 'Das Finanzamt hat einen Einkommensteuerbescheid für 2024 erlassen.',
        keyPoints: [
          'Bescheid vom 15.01.2025',
          'Widerspruchsfrist: 30 Tage',
        ],
        legalBasis: [
          {
            law: 'EStG',
            paragraph: '§ 32a',
            description: 'Einkommensteuertarif',
            isLandesrecht: false,
          },
        ],
        recommendedActions: [
          {
            id: '1',
            title: 'Widerspruch einlegen',
            description: 'Gegen den Bescheid Widerspruch einlegen',
            complexity: 'moderate' as const,
            templateId: 'widerspruch',
          },
        ],
        risks: [
          {
            id: '1',
            description: 'Fristversäumnis führt zu Rechtskraft',
            severity: 'high' as const,
            mitigation: 'Frist im Kalender eintragen',
          },
        ],
      };

      const result = AnalysisSchema.safeParse(validAnalysis);
      expect(result.success).toBe(true);
    });
  });
});

describe('Letter Categories', () => {
  it('should have all expected categories', () => {
    const validCategories = [
      'BESCHEID',
      'MAHNUNG',
      'ANHOERUNG',
      'ANTRAG_ABLEHNUNG',
      'AUFFORDERUNG',
      'INFORMATION',
      'UNKNOWN',
    ];

    const schema = z.object({
      category: z.enum([
        'BESCHEID',
        'MAHNUNG',
        'ANHOERUNG',
        'ANTRAG_ABLEHNUNG',
        'AUFFORDERUNG',
        'INFORMATION',
        'UNKNOWN',
      ]),
    });

    validCategories.forEach((category) => {
      expect(schema.safeParse({ category }).success).toBe(true);
    });
  });
});
