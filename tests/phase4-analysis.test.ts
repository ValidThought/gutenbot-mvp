import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Set test environment
vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');

describe('Phase 4: LLM Analysis Module', () => {
  const projectRoot = process.cwd();

  describe('Claude Client', () => {
    it('should export required functions', async () => {
      const client = await import('@/lib/llm/client');
      
      expect(client.complete).toBeDefined();
      expect(typeof client.complete).toBe('function');
      
      expect(client.completeWithSchema).toBeDefined();
      expect(typeof client.completeWithSchema).toBe('function');
      
      expect(client.countTokens).toBeDefined();
      expect(typeof client.countTokens).toBe('function');
    });

    it('should have complete function defined', async () => {
      const { complete } = await import('@/lib/llm/client');
      expect(complete).toBeDefined();
      expect(typeof complete).toBe('function');
    });

    it('should count tokens correctly', async () => {
      const { countTokens } = await import('@/lib/llm/client');
      
      expect(countTokens('test')).toBe(1); // 4 chars = 1 token
      expect(countTokens('Dies ist ein deutscher Text')).toBe(7);
    });

    it('should export setClient and resetClient for testing', async () => {
      const { setClient, resetClient } = await import('@/lib/llm/client');
      
      expect(typeof setClient).toBe('function');
      expect(typeof resetClient).toBe('function');
    });
  });

  describe('Prompts', () => {
    it('should export all prompt templates', async () => {
      const prompts = await import('@/lib/llm/prompts');
      
      expect(prompts.CLASSIFICATION_SYSTEM_PROMPT).toBeDefined();
      expect(prompts.ANALYSIS_SYSTEM_PROMPT).toBeDefined();
      expect(prompts.RESPONSE_GENERATION_PROMPT).toBeDefined();
      expect(prompts.SUMMARY_PROMPT).toBeDefined();
    });

    it('should have required placeholders in prompts', async () => {
      const prompts = await import('@/lib/llm/prompts');
      
      expect(prompts.CLASSIFICATION_SYSTEM_PROMPT).toContain('{{bundesland}}');
      expect(prompts.CLASSIFICATION_SYSTEM_PROMPT).toContain('{{landesrecht}}');
      
      expect(prompts.ANALYSIS_SYSTEM_PROMPT).toContain('{{bundesland}}');
      expect(prompts.ANALYSIS_SYSTEM_PROMPT).toContain('{{classification}}');
      
      expect(prompts.RESPONSE_GENERATION_PROMPT).toContain('{{actionType}}');
      expect(prompts.RESPONSE_GENERATION_PROMPT).toContain('{{userName}}');
    });

    it('should have template fill function', async () => {
      const { fillTemplate } = await import('@/lib/llm/prompts');
      
      const template = 'Hello {{name}}, welcome to {{place}}!';
      const result = fillTemplate(template, { name: 'Hans', place: 'Berlin' });
      
      expect(result).toBe('Hello Hans, welcome to Berlin!');
    });

    it('should replace all placeholders', async () => {
      const { fillTemplate } = await import('@/lib/llm/prompts');
      
      const template = '{{a}} {{b}} {{c}}';
      const result = fillTemplate(template, { a: '1', b: '2', c: '3' });
      
      expect(result).toBe('1 2 3');
      expect(result).not.toContain('{{');
    });

    it('should have createClassificationPrompt function', async () => {
      const { createClassificationPrompt } = await import('@/lib/llm/prompts');
      
      const prompt = createClassificationPrompt('BE', 'VwVfG Bln');
      
      expect(prompt).toContain('BE');
      expect(prompt).toContain('VwVfG Bln');
      expect(prompt).not.toContain('{{bundesland}}');
      expect(prompt).not.toContain('{{landesrecht}}');
    });

    it('should have createAnalysisPrompt function', async () => {
      const { createAnalysisPrompt } = await import('@/lib/llm/prompts');
      
      const prompt = createAnalysisPrompt('BE', 'VwVfG Bln', '{"category":"BESCHEID"}');
      
      expect(prompt).toContain('BE');
      expect(prompt).toContain('VwVfG Bln');
      expect(prompt).toContain('BESCHEID');
      expect(prompt).not.toContain('{{bundesland}}');
    });

    it('should support different bundesländer in prompts', async () => {
      const { createClassificationPrompt } = await import('@/lib/llm/prompts');
      
      const bePrompt = createClassificationPrompt('BE', 'VwVfG Bln');
      const hePrompt = createClassificationPrompt('HE', 'HVwVfG');
      const bwPrompt = createClassificationPrompt('BW', 'LVwVfG');
      
      expect(bePrompt).toContain('BE');
      expect(hePrompt).toContain('HE');
      expect(bwPrompt).toContain('BW');
    });
  });

  describe('Zod Schemas', () => {
    it('should export all schemas', async () => {
      const schemas = await import('@/lib/llm/schemas');
      
      expect(schemas.ClassificationSchema).toBeDefined();
      expect(schemas.AnalysisSchema).toBeDefined();
      expect(schemas.FullAnalysisSchema).toBeDefined();
      expect(schemas.DeadlineSchema).toBeDefined();
      expect(schemas.LegalReferenceSchema).toBeDefined();
      expect(schemas.RecommendedActionSchema).toBeDefined();
      expect(schemas.RiskSchema).toBeDefined();
    });

    it('should validate valid classification data', async () => {
      const { ClassificationSchema } = await import('@/lib/llm/schemas');
      
      const validData = {
        category: 'BESCHEID',
        confidence: 0.95,
        sender: { name: 'Finanzamt', type: 'government', jurisdiction: 'BE' },
        subject: 'Einkommensteuerbescheid',
        deadlines: [],
      };
      
      const result = ClassificationSchema.parse(validData);
      expect(result.category).toBe('BESCHEID');
    });

    it('should reject invalid category', async () => {
      const { ClassificationSchema } = await import('@/lib/llm/schemas');
      
      const invalidData = {
        category: 'INVALID',
        confidence: 0.95,
        sender: { name: 'Test', type: 'unknown' },
        subject: 'Test',
        deadlines: [],
      };
      
      expect(() => ClassificationSchema.parse(invalidData)).toThrow();
    });

    it('should reject confidence out of range', async () => {
      const { ClassificationSchema } = await import('@/lib/llm/schemas');
      
      const invalidData = {
        category: 'BESCHEID',
        confidence: 1.5, // Should be 0-1
        sender: { name: 'Test', type: 'unknown' },
        subject: 'Test',
        deadlines: [],
      };
      
      expect(() => ClassificationSchema.parse(invalidData)).toThrow();
    });

    it('should validate full analysis data', async () => {
      const { FullAnalysisSchema } = await import('@/lib/llm/schemas');
      
      const validData = {
        classification: {
          category: 'BESCHEID',
          confidence: 0.95,
          sender: { name: 'Finanzamt', type: 'government' },
          subject: 'Test',
          deadlines: [],
        },
        analysis: {
          summary: 'Test summary',
          keyPoints: ['Point 1'],
          legalBasis: [],
          recommendedActions: [],
          risks: [],
        },
      };
      
      const result = FullAnalysisSchema.parse(validData);
      expect(result.classification.category).toBe('BESCHEID');
    });

    it('should export validation helper functions', async () => {
      const { validateClassification, validateAnalysis, validateFullAnalysis } = await import('@/lib/llm/schemas');
      
      expect(typeof validateClassification).toBe('function');
      expect(typeof validateAnalysis).toBe('function');
      expect(typeof validateFullAnalysis).toBe('function');
    });

    it('should validate deadline with urgency levels', async () => {
      const { DeadlineSchema } = await import('@/lib/llm/schemas');
      
      const validDeadline = {
        type: 'widerspruch',
        date: '2025-02-15',
        daysRemaining: 30,
        urgency: 'high',
        isLegal: true,
        description: 'Widerspruchsfrist',
      };
      
      const result = DeadlineSchema.parse(validDeadline);
      expect(result.urgency).toBe('high');
    });

    it('should validate recommended action complexity', async () => {
      const { RecommendedActionSchema } = await import('@/lib/llm/schemas');
      
      const validAction = {
        id: '1',
        title: 'Widerspruch',
        description: 'Widerspruch einlegen',
        complexity: 'moderate',
      };
      
      const result = RecommendedActionSchema.parse(validAction);
      expect(result.complexity).toBe('moderate');
    });
  });

  describe('Analysis API Route', () => {
    it('should have analysis route file', () => {
      const routePath = join(projectRoot, 'src/app/api/analyze/route.ts');
      expect(() => readFileSync(routePath, 'utf-8')).not.toThrow();
    });

    it('should export POST handler', () => {
      const routePath = join(projectRoot, 'src/app/api/analyze/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('export async function POST');
      expect(route).toContain('NextRequest');
      expect(route).toContain('NextResponse');
    });

    it('should handle missing text', () => {
      const routePath = join(projectRoot, 'src/app/api/analyze/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('400');
      expect(route).toContain('Kein Text vorhanden');
    });

    it('should handle missing bundesland', () => {
      const routePath = join(projectRoot, 'src/app/api/analyze/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('Bundesland');
    });

    it('should load Bundesland data', () => {
      const routePath = join(projectRoot, 'src/app/api/analyze/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('getLandesrechtContext');
      expect(route).toContain('src/data/bundeslaender');
    });

    it('should have generateResponseDraft helper', () => {
      const routePath = join(projectRoot, 'src/app/api/analyze/route.ts');
      const route = readFileSync(routePath, 'utf-8');
      
      expect(route).toContain('generateResponseDraft');
      expect(route).toContain('src/data/templates');
    });
  });

  describe('Interlock: Analysis → UI', () => {
    it('schema output should match UI component types', async () => {
      const { FullAnalysisSchema } = await import('@/lib/llm/schemas');
      
      const validData = {
        classification: {
          category: 'BESCHEID',
          confidence: 0.95,
          sender: { name: 'Finanzamt', type: 'government', jurisdiction: 'BE' },
          subject: 'Einkommensteuerbescheid',
          deadlines: [
            {
              type: 'widerspruch',
              date: '2025-02-15',
              daysRemaining: 30,
              urgency: 'high' as const,
              isLegal: true,
              description: 'Widerspruchsfrist',
            },
          ],
        },
        analysis: {
          summary: 'Test',
          keyPoints: ['P1'],
          legalBasis: [
            { law: 'VwVfG', paragraph: '§ 70', description: 'Widerspruch', isLandesrecht: true },
          ],
          recommendedActions: [
            {
              id: '1',
              title: 'Widerspruch',
              description: 'Widerspruch einlegen',
              complexity: 'moderate',
              templateId: 'widerspruch',
            },
          ],
          risks: [],
        },
      };
      
      const result = FullAnalysisSchema.parse(validData);
      
      // These should match the types used in UI components
      expect(result.classification.category).toBeDefined();
      expect(result.analysis.recommendedActions).toBeInstanceOf(Array);
    });

    it('prompt templates should work with all Bundesland codes', async () => {
      const { createClassificationPrompt } = await import('@/lib/llm/prompts');
      
      const codes = ['BE', 'HE', 'BW', 'BY', 'BB', 'HB', 'HH', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
      
      codes.forEach(code => {
        const prompt = createClassificationPrompt(code, 'Test Law');
        expect(prompt).toContain(code);
        expect(prompt).toContain('Test Law');
        expect(prompt).not.toContain('{{bundesland}}');
      });
    });

    it('fillTemplate should handle empty variables', async () => {
      const { fillTemplate } = await import('@/lib/llm/prompts');
      
      const template = 'Hello {{name}}!';
      const result = fillTemplate(template, {});
      
      expect(result).toBe('Hello {{name}}!');
    });

    it('should support all letter categories', async () => {
      const { ClassificationSchema } = await import('@/lib/llm/schemas');
      
      const categories = ['BESCHEID', 'MAHNUNG', 'ANHOERUNG', 'ANTRAG_ABLEHNUNG', 'AUFFORDERUNG', 'INFORMATION', 'UNKNOWN'];
      
      categories.forEach(category => {
        const data = {
          category,
          confidence: 0.9,
          sender: { name: 'Test', type: 'unknown' },
          subject: 'Test',
          deadlines: [],
        };
        
        expect(() => ClassificationSchema.parse(data)).not.toThrow();
      });
    });
  });
});
