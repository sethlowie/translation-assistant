import { NextRequest, NextResponse } from 'next/server';
import { ActionDetector } from '@/lib/server/actions/detector';
import { AIActionDetector } from '@/lib/server/actions/ai-detector';
import { connectToDatabase } from '@/lib/server/db';
import { actionCreateSchema } from '@/lib/schemas/action.schema';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    const { utteranceId, conversationId, utterance, role, detectionMode } = body;
    
    if (!utteranceId || !conversationId || !utterance || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize detectors based on client preference or environment
    const useAI = detectionMode === 'regex' ? false : 
                  process.env.USE_AI_DETECTION !== 'false'; // Default to AI detection
    const detector = useAI ? new AIActionDetector() : new ActionDetector();
    
    console.log('[Action Detection] Processing utterance:', {
      utterance,
      role,
      conversationId,
      utteranceId,
      usingAI: useAI
    });
    
    // Detect actions in the utterance
    const detectedActions = await detector.detectActions(utterance, {
      conversationId,
      utteranceId,
      role,
    });
    
    console.log('[Action Detection] Detected actions:', detectedActions);

    // Save detected actions to database
    const savedActions = [];
    
    for (const detectedAction of detectedActions) {
      try {
        const actionData = {
          conversationId: new ObjectId(conversationId),
          utteranceId: new ObjectId(utteranceId),
          type: detectedAction.type,
          category: 'routine' as const,
          details: detectedAction.details,
          confidence: detectedAction.confidence,
          validated: false,
          detectedAt: new Date(),
        };
        
        // Validate with schema
        const validated = actionCreateSchema.parse(actionData);
        
        // Insert into database
        const result = await db.collection('actions').insertOne(validated);
        
        savedActions.push({
          id: result.insertedId.toString(),
          type: detectedAction.type,
          details: detectedAction.details,
          confidence: detectedAction.confidence,
          validated: false,
        });
      } catch (error) {
        console.error('Failed to save action:', error);
      }
    }

    return NextResponse.json({
      success: true,
      actions: savedActions,
      totalDetected: detectedActions.length,
      totalSaved: savedActions.length,
    });
  } catch (error) {
    console.error('Action detection failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect actions',
      },
      { status: 500 }
    );
  }
}