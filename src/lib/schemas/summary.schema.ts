import { z } from 'zod';
import { ObjectId } from 'mongodb';

export const summaryCreateSchema = z.object({
  conversationId: z.instanceof(ObjectId),
  content: z.object({
    chiefComplaint: z.string(),
    historyOfPresentIllness: z.string(),
    assessmentAndPlan: z.string(),
    medicationsDiscussed: z.array(z.string()),
    testsOrdered: z.array(z.string()),
    followUpInstructions: z.string(),
  }),
  extractedData: z.object({
    symptoms: z.array(z.object({
      name: z.string(),
      duration: z.string().optional(),
      severity: z.string().optional(),
    })),
    vitalSigns: z.object({
      bloodPressure: z.string().optional(),
      heartRate: z.string().optional(),
      temperature: z.string().optional(),
      weight: z.string().optional(),
    }).optional(),
    diagnoses: z.array(z.object({
      description: z.string(),
      icd10Code: z.string().optional(),
      confidence: z.number().min(0).max(1),
    })),
  }),
  generatedBy: z.enum(['automatic', 'manual']),
  model: z.string(),
  prompt: z.string().optional(),
  reviewStatus: z.enum(['pending', 'approved', 'edited']).default('pending'),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
  generatedAt: z.date().default(() => new Date()),
  reviewedAt: z.date().optional(),
});

export const summaryDocumentSchema = summaryCreateSchema.extend({
  _id: z.instanceof(ObjectId),
});

export type SummaryCreate = z.infer<typeof summaryCreateSchema>;
export type SummaryDocument = z.infer<typeof summaryDocumentSchema>;