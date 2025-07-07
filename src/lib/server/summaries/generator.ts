import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../db';
import { SummaryCreate } from '@/lib/schemas/summary.schema';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export class SummaryGenerator {
  async generateSummary(conversationId: string): Promise<SummaryCreate> {
    const { db } = await connectToDatabase();
    
    // Get all utterances for the conversation
    const utterances = await db
      .collection('utterances')
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ sequenceNumber: 1 })
      .toArray();

    // Get all actions for the conversation
    const actions = await db
      .collection('actions')
      .find({ conversationId: new ObjectId(conversationId) })
      .toArray();

    // Create transcript
    const transcript = utterances
      .map((u) => `${u.role === 'clinician' ? 'Doctor' : 'Patient'}: ${u.originalText}`)
      .join('\n');

    // Format actions for the prompt
    const formattedActions = actions.map((a) => {
      switch (a.type) {
        case 'prescription':
          return `Prescription: ${a.details.medication.name} ${a.details.medication.dosage || ''} ${a.details.medication.frequency || ''}`;
        case 'lab_order':
          return `Lab Order: ${a.details.labTest.name}`;
        case 'follow_up':
          return `Follow-up: ${a.details.followUp.timeframe}`;
        case 'referral':
          return `Referral: ${a.details.referral.specialty}`;
        case 'diagnostic_test':
          return `Diagnostic Test: ${a.details.test.name}`;
        default:
          return `${a.type}: ${JSON.stringify(a.details)}`;
      }
    }).join('\n');

    const prompt = `Generate a clinical summary from this medical conversation.

Conversation Transcript:
${transcript}

Detected Medical Actions:
${formattedActions}

Create a professional clinical summary with these sections:
1. Chief Complaint - The main reason for the visit
2. History of Present Illness - Details about the current condition
3. Assessment and Plan - Medical assessment and treatment plan
4. Medications Discussed - List all medications mentioned
5. Tests Ordered - List all tests/labs ordered
6. Follow-up Instructions - Next steps for the patient

Also extract:
- Symptoms with duration and severity
- Any vital signs mentioned (blood pressure, heart rate, temperature, weight)
- Potential diagnoses with ICD-10 codes if possible

Format the response as JSON with the structure:
{
  "chiefComplaint": "...",
  "historyOfPresentIllness": "...",
  "assessmentAndPlan": "...",
  "medicationsDiscussed": ["..."],
  "testsOrdered": ["..."],
  "followUpInstructions": "...",
  "symptoms": [{"name": "...", "duration": "...", "severity": "..."}],
  "vitalSigns": {"bloodPressure": "...", "heartRate": "...", "temperature": "...", "weight": "..."},
  "diagnoses": [{"description": "...", "icd10Code": "...", "confidence": 0.8}]
}`;

    // Call OpenAI to generate the summary
    const summaryData = await this.callOpenAI(prompt);

    const summary: SummaryCreate = {
      conversationId: new ObjectId(conversationId),
      content: {
        chiefComplaint: summaryData.chiefComplaint,
        historyOfPresentIllness: summaryData.historyOfPresentIllness,
        assessmentAndPlan: summaryData.assessmentAndPlan,
        medicationsDiscussed: summaryData.medicationsDiscussed,
        testsOrdered: summaryData.testsOrdered,
        followUpInstructions: summaryData.followUpInstructions,
      },
      extractedData: {
        symptoms: summaryData.symptoms,
        vitalSigns: summaryData.vitalSigns,
        diagnoses: summaryData.diagnoses,
      },
      generatedBy: 'automatic',
      model: 'gpt-4o-mini',
      prompt,
      reviewStatus: 'pending',
      generatedAt: new Date(),
    };

    return summary;
  }

  private async callOpenAI(prompt: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Define the schema for the summary
    const summarySchema = z.object({
      chiefComplaint: z.string().describe('The main reason for the visit'),
      historyOfPresentIllness: z.string().describe('Details about the current condition'),
      assessmentAndPlan: z.string().describe('Medical assessment and treatment plan'),
      medicationsDiscussed: z.array(z.string()).describe('List of all medications mentioned'),
      testsOrdered: z.array(z.string()).describe('List of all tests/labs ordered'),
      followUpInstructions: z.string().describe('Next steps for the patient'),
      symptoms: z.array(z.object({
        name: z.string(),
        duration: z.string().optional(),
        severity: z.string().optional(),
      })).describe('Symptoms with duration and severity'),
      vitalSigns: z.object({
        bloodPressure: z.string().optional(),
        heartRate: z.string().optional(),
        temperature: z.string().optional(),
        weight: z.string().optional(),
      }).optional().describe('Any vital signs mentioned'),
      diagnoses: z.array(z.object({
        description: z.string(),
        icd10Code: z.string().optional(),
        confidence: z.number().min(0).max(1),
      })).describe('Potential diagnoses with ICD-10 codes'),
    });

    try {
      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: summarySchema,
        system: 'You are a medical documentation assistant. Generate clinical summaries from conversation transcripts.',
        prompt,
        temperature: 0.3,
      });

      return object;
    } catch (error) {
      console.error('Failed to generate summary with gpt-4o-mini:', error);
      
      // Fallback to gpt-3.5-turbo
      try {
        console.log('Retrying with gpt-3.5-turbo...');
        const { object } = await generateObject({
          model: openai('gpt-3.5-turbo'),
          schema: summarySchema,
          system: 'You are a medical documentation assistant. Generate clinical summaries from conversation transcripts.',
          prompt,
          temperature: 0.3,
        });

        return object;
      } catch (fallbackError) {
        // Include parsing errors in the error message for debugging
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        const detailedError = `Summary generation failed. Model errors: ${errorMessage}`;
        
        console.error('Summary generation failed with both models:', detailedError);
        throw new Error(detailedError);
      }
    }
  }
}