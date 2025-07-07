import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/db';
import { conversationCreateSchema } from '@/lib/schemas/conversation.schema';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    // Add sessionId and other required fields
    const conversationData = {
      ...body,
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      status: 'active' as const,
      utteranceCount: 0,
      actionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Validate with Zod
    const validated = conversationCreateSchema.parse(conversationData);
    
    // Insert into MongoDB
    const result = await db.collection('conversations').insertOne(validated);
    
    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...validated,
      },
    });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to create conversation',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const conversations = await db
      .collection('conversations')
      .find({ status: 'active' })
      .sort({ startTime: -1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      data: conversations.map(conv => ({
        ...conv,
        id: conv._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch conversations',
      },
      { status: 500 }
    );
  }
}