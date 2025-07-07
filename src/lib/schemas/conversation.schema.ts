import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Base schema for creation (no _id)
export const conversationCreateSchema = z.object({
  sessionId: z.string().min(1),
  clinicianId: z.string().optional(),
  patientId: z.string().optional(),
  startTime: z.date(),
  status: z.literal('active'),
  language: z.object({
    primary: z.enum(['en', 'es']),
    secondary: z.enum(['en', 'es'])
  }),
  metadata: z.object({
    location: z.string().optional(),
    visitType: z.string().optional(),
    department: z.string().optional()
  }).optional(),
  utteranceCount: z.number().default(0),
  actionCount: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// Schema for updates
export const conversationUpdateSchema = conversationCreateSchema.partial().extend({
  endTime: z.date().optional(),
  duration: z.number().optional(),
  status: z.enum(['active', 'completed', 'error']).optional(),
  errorDetails: z.object({
    code: z.string(),
    message: z.string(),
    timestamp: z.date()
  }).optional()
});

// Schema for database documents (includes _id)
export const conversationDocumentSchema = conversationCreateSchema.extend({
  _id: z.instanceof(ObjectId),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  status: z.enum(['active', 'completed', 'error']),
  errorDetails: z.object({
    code: z.string(),
    message: z.string(),
    timestamp: z.date()
  }).optional()
});

// Type exports
export type ConversationCreate = z.infer<typeof conversationCreateSchema>;
export type ConversationUpdate = z.infer<typeof conversationUpdateSchema>;
export type ConversationDocument = z.infer<typeof conversationDocumentSchema>;