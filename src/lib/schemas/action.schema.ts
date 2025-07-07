import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Prescription details schema
const prescriptionDetailsSchema = z.object({
  medication: z.object({
    name: z.string(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    rxnormCode: z.string().optional(),
  }),
});

// Lab order details schema
const labOrderDetailsSchema = z.object({
  labTest: z.object({
    name: z.string(),
    loincCode: z.string().optional(),
    urgency: z.string().optional(),
  }),
});

// Referral details schema
const referralDetailsSchema = z.object({
  referral: z.object({
    specialty: z.string(),
    reason: z.string(),
    urgency: z.string(),
  }),
});

// Follow-up details schema
const followUpDetailsSchema = z.object({
  followUp: z.object({
    timeframe: z.string(),
    reason: z.string(),
  }),
});

// Diagnostic test details schema
const diagnosticTestDetailsSchema = z.object({
  test: z.object({
    name: z.string(),
    type: z.string().optional(),
    urgency: z.string().optional(),
  }),
});

// Union of all detail types
const actionDetailsSchema = z.union([
  prescriptionDetailsSchema,
  labOrderDetailsSchema,
  referralDetailsSchema,
  followUpDetailsSchema,
  diagnosticTestDetailsSchema,
]);

export const actionCreateSchema = z.object({
  conversationId: z.instanceof(ObjectId),
  utteranceId: z.instanceof(ObjectId),
  type: z.enum([
    'lab_order',
    'prescription',
    'referral',
    'follow_up',
    'diagnostic_test',
    'vaccination',
    'procedure',
  ]),
  category: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  details: actionDetailsSchema,
  confidence: z.number().min(0).max(1),
  validated: z.boolean().default(false),
  validatedBy: z.string().optional(),
  validatedAt: z.date().optional(),
  webhook: z.object({
    url: z.string(),
    status: z.enum(['pending', 'sent', 'failed', 'acknowledged']).default('pending'),
    attempts: z.number().default(0),
    lastAttempt: z.date().optional(),
    response: z.unknown().optional(),
    error: z.string().optional(),
  }).optional(),
  codes: z.object({
    icd10: z.array(z.string()).optional(),
    cpt: z.array(z.string()).optional(),
  }).optional(),
  detectedAt: z.date().default(() => new Date()),
  executedAt: z.date().optional(),
});

export const actionDocumentSchema = actionCreateSchema.extend({
  _id: z.instanceof(ObjectId),
});

export type ActionCreate = z.infer<typeof actionCreateSchema>;
export type ActionDocument = z.infer<typeof actionDocumentSchema>;