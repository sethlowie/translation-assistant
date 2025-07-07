import { DetectedAction, ActionContext } from './detector';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { CoreTool } from 'ai';

// Define schemas for each action type
const prescriptionSchema = z.object({
  medication: z.object({
    name: z.string().describe('The name of the medication (keep in original form, do not translate)'),
    dosage: z.string().optional().describe('Dosage amount and unit (e.g., "500mg", "10ml")'),
    frequency: z.string().optional().describe('How often to take (e.g., "twice daily", "every 8 hours")'),
    duration: z.string().optional().describe('How long to take (e.g., "for 7 days", "for 2 weeks")'),
    route: z.enum(['oral', 'topical', 'injection', 'inhalation', 'other']).optional().describe('Route of administration'),
  }),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
});

const labOrderSchema = z.object({
  labTest: z.object({
    name: z.string().describe('Name of the lab test (e.g., "CBC", "glucose", "cholesterol panel")'),
    urgency: z.enum(['routine', 'urgent', 'stat']).optional().describe('Urgency level of the test'),
    reason: z.string().optional().describe('Clinical reason for ordering the test'),
  }),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
});

const referralSchema = z.object({
  referral: z.object({
    specialty: z.string().describe('Medical specialty (e.g., "cardiologist", "dermatologist")'),
    reason: z.string().describe('Reason for the referral'),
    urgency: z.enum(['routine', 'urgent', 'emergent']).describe('Urgency of the referral'),
  }),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
});

const followUpSchema = z.object({
  followUp: z.object({
    timeframe: z.string().describe('When to follow up (e.g., "in 2 weeks", "in 3 months")'),
    reason: z.string().describe('Reason for follow-up'),
    type: z.enum(['in-person', 'telemedicine', 'phone', 'any']).optional().describe('Type of follow-up visit'),
  }),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
});

const diagnosticTestSchema = z.object({
  test: z.object({
    name: z.string().describe('Name of the test (e.g., "chest X-ray", "MRI brain", "ECG")'),
    type: z.enum(['radiology', 'mri', 'ct', 'ultrasound', 'cardiac', 'other']).describe('Type of diagnostic test'),
    urgency: z.enum(['routine', 'urgent', 'stat']).optional().describe('Urgency of the test'),
    indication: z.string().optional().describe('Clinical indication for the test'),
  }),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
});

// Define tools for Vercel AI SDK
const medicalActionTools: Record<string, CoreTool> = {
  detect_prescription: {
    description: 'Detects when a healthcare provider prescribes medication to a patient',
    parameters: prescriptionSchema,
    execute: async (args) => args,
  },
  detect_lab_order: {
    description: 'Detects when a healthcare provider orders laboratory tests',
    parameters: labOrderSchema,
    execute: async (args) => args,
  },
  detect_referral: {
    description: 'Detects when a healthcare provider refers a patient to a specialist',
    parameters: referralSchema,
    execute: async (args) => args,
  },
  detect_follow_up: {
    description: 'Detects when a healthcare provider schedules a follow-up appointment',
    parameters: followUpSchema,
    execute: async (args) => args,
  },
  detect_diagnostic_test: {
    description: 'Detects when a healthcare provider orders imaging or diagnostic procedures',
    parameters: diagnosticTestSchema,
    execute: async (args) => args,
  },
};

export class AIActionDetector {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
  }

  async detectActions(
    utterance: string,
    context: ActionContext
  ): Promise<DetectedAction[]> {
    console.log('[AIActionDetector] Detecting actions using AI for:', utterance);

    // Only detect actions from clinician utterances
    if (context.role !== 'clinician') {
      console.log('[AIActionDetector] Skipping non-clinician utterance');
      return [];
    }

    try {
      const { toolCalls } = await generateText({
        model: openai('gpt-4o-mini'),
        system: `You are a medical language processing assistant. Analyze healthcare provider utterances and detect medical actions using the provided tools. 
        
        Important rules:
        1. Only call tools if you detect a clear medical action
        2. Preserve medical terminology exactly as spoken (do not translate or modify)
        3. Set confidence based on how clear and explicit the action is
        4. Multiple actions can be detected from a single utterance
        5. Do not infer actions that are not explicitly stated`,
        prompt: utterance,
        tools: medicalActionTools,
        toolChoice: 'auto',
        temperature: 0.1, // Low temperature for consistent detection
      });

      if (!toolCalls || toolCalls.length === 0) {
        console.log('[AIActionDetector] No actions detected by AI');
        return [];
      }

      // Process tool calls into DetectedAction objects
      const actions: DetectedAction[] = [];
      
      for (const toolCall of toolCalls) {
        console.log('[AIActionDetector] Tool called:', toolCall.toolName, toolCall.args);
        
        switch (toolCall.toolName) {
          case 'detect_prescription': {
            const args = toolCall.args as z.infer<typeof prescriptionSchema>;
            actions.push({
              type: 'prescription',
              details: {
                medication: {
                  name: args.medication.name,
                  dosage: args.medication.dosage,
                  frequency: args.medication.frequency,
                  duration: args.medication.duration,
                  rxnormCode: undefined, // Could be enhanced with RxNorm lookup
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
              detectedTerms: [args.medication.name]
            });
            break;
          }
            
          case 'detect_lab_order': {
            const args = toolCall.args as z.infer<typeof labOrderSchema>;
            actions.push({
              type: 'lab_order',
              details: {
                labTest: {
                  name: args.labTest.name,
                  urgency: args.labTest.urgency,
                  loincCode: undefined, // Could be enhanced with LOINC lookup
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
              detectedTerms: [args.labTest.name]
            });
            break;
          }
            
          case 'detect_referral': {
            const args = toolCall.args as z.infer<typeof referralSchema>;
            actions.push({
              type: 'referral',
              details: {
                referral: {
                  specialty: args.referral.specialty,
                  reason: args.referral.reason,
                  urgency: args.referral.urgency
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
            });
            break;
          }
            
          case 'detect_follow_up': {
            const args = toolCall.args as z.infer<typeof followUpSchema>;
            actions.push({
              type: 'follow_up',
              details: {
                followUp: {
                  timeframe: args.followUp.timeframe,
                  reason: args.followUp.reason
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
            });
            break;
          }
            
          case 'detect_diagnostic_test': {
            const args = toolCall.args as z.infer<typeof diagnosticTestSchema>;
            actions.push({
              type: 'diagnostic_test',
              details: {
                test: {
                  name: args.test.name,
                  type: args.test.type,
                  urgency: args.test.urgency
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
              detectedTerms: [args.test.name]
            });
            break;
          }
        }
      }
      
      console.log('[AIActionDetector] Detected actions:', actions);
      return actions;
      
    } catch (error) {
      // Enhanced error logging for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AIActionDetector] Error detecting actions:', errorMessage);
      
      // For hackathon debugging, include more details
      if (error instanceof Error && 'cause' in error) {
        console.error('[AIActionDetector] Error cause:', error.cause);
      }
      
      return [];
    }
  }
}