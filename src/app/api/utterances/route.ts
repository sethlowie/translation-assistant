import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/db';
import { utteranceCreateSchema } from '@/lib/schemas/utterance.schema';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    // Convert conversationId to ObjectId
    const utteranceData = {
      ...body,
      conversationId: new ObjectId(body.conversationId),
      timestamp: new Date(body.timestamp),
      confidence: body.confidence || {
        transcription: 0.95,
        translation: 0.95,
      },
    };
    
    // Validate with Zod
    const validated = utteranceCreateSchema.parse(utteranceData);
    
    // Insert into MongoDB
    const result = await db.collection('utterances').insertOne(validated);
    
    // Update conversation utterance count
    await db.collection('conversations').updateOne(
      { _id: validated.conversationId },
      { 
        $inc: { utteranceCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...validated,
        conversationId: validated.conversationId.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to create utterance:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to create utterance',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId || !ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { success: false, error: 'Valid conversationId is required' },
        { status: 400 }
      );
    }
    
    const utterances = await db
      .collection('utterances')
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ sequenceNumber: 1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      data: utterances.map(utterance => ({
        ...utterance,
        id: utterance._id.toString(),
        conversationId: utterance.conversationId.toString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch utterances:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch utterances',
      },
      { status: 500 }
    );
  }
}