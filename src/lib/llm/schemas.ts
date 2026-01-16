import { z } from 'zod';

export const DeadlineSchema = z.object({
  type: z.string(),
  date: z.string(), // Keep as string for API response
  daysRemaining: z.number(),
  urgency: z.enum(['critical', 'high', 'medium', 'low']),
  isLegal: z.boolean(),
  description: z.string(),
});

export const SenderSchema = z.object({
  name: z.string(),
  type: z.enum(['government', 'corporate', 'unknown']),
  jurisdiction: z.string().optional(),
});

export const ClassificationSchema = z.object({
  category: z.enum([
    'BESCHEID',
    'MAHNUNG',
    'ANHOERUNG',
    'ANTRAG_ABLEHNUNG',
    'AUFFORDERUNG',
    'INFORMATION',
    'UNKNOWN',
  ]),
  confidence: z.number().min(0).max(1),
  sender: SenderSchema,
  subject: z.string(),
  receivedDate: z.string().nullable().optional(),
  documentDate: z.string().nullable().optional(),
  deadlines: z.array(DeadlineSchema),
});

export const LegalReferenceSchema = z.object({
  law: z.string(),
  paragraph: z.string(),
  description: z.string(),
  url: z.string().url().optional().or(z.literal('')),
  isLandesrecht: z.boolean(),
});

export const RecommendedActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  deadline: z.string().nullable().optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  templateId: z.string().optional(),
  risks: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
});

export const RiskSchema = z.object({
  id: z.string(),
  description: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  mitigation: z.string(),
  deadline: z.string().nullable().optional(),
});

export const AnalysisSchema = z.object({
  summary: z.string().max(200),
  keyPoints: z.array(z.string()).max(5),
  legalBasis: z.array(LegalReferenceSchema),
  recommendedActions: z.array(RecommendedActionSchema),
  risks: z.array(RiskSchema),
  additionalNotes: z.string().optional(),
});

export const FullAnalysisSchema = z.object({
  classification: ClassificationSchema,
  analysis: AnalysisSchema,
});

export type Classification = z.infer<typeof ClassificationSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type FullAnalysis = z.infer<typeof FullAnalysisSchema>;
export type Deadline = z.infer<typeof DeadlineSchema>;
export type LegalReference = z.infer<typeof LegalReferenceSchema>;
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>;
export type Risk = z.infer<typeof RiskSchema>;

export function validateClassification(data: unknown): Classification {
  return ClassificationSchema.parse(data);
}

export function validateAnalysis(data: unknown): Analysis {
  return AnalysisSchema.parse(data);
}

export function validateFullAnalysis(data: unknown): FullAnalysis {
  return FullAnalysisSchema.parse(data);
}
