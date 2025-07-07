import { z } from 'zod';
import { ObjectId } from 'mongodb';

export const utteranceCreateSchema = z.object({
  conversationId: z.instanceof(ObjectId),
  role: z.enum(['clinician', 'patient', 'assistant', 'family']),
  speakerId: z.string().optional(),
  originalLanguage: z.enum(['en', 'es']),
  originalText: z.string().min(1),
  translatedText: z.string().optional(),
  audioData: z.object({
    url: z.string().url().optional(),
    duration: z.number().positive(),
    format: z.enum(['pcm16', 'mp3'])
  }).optional(),
  confidence: z.object({
    transcription: z.number().min(0).max(1),
    translation: z.number().min(0).max(1)
  }),
  medicalTerms: z.array(z.object({
    term: z.string(),
    category: z.enum(['medication', 'procedure', 'condition', 'anatomy']),
    confidence: z.number().min(0).max(1),
    icd10: z.array(z.string()).optional(),
    rxnorm: z.string().optional()
  })).optional(),
  flags: z.object({
    isRepeatRequest: z.boolean().optional(),
    containsPHI: z.boolean().optional(),
    needsReview: z.boolean().optional()
  }).default({}),
  timestamp: z.date(),
  sequenceNumber: z.number().int().positive()
});

export const utteranceDocumentSchema = utteranceCreateSchema.extend({
  _id: z.instanceof(ObjectId)
});

export type UtteranceCreate = z.infer<typeof utteranceCreateSchema>;
export type UtteranceDocument = z.infer<typeof utteranceDocumentSchema>;