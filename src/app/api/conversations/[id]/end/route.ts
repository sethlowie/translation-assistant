import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/db';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const { id: conversationId } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }
    
    // Find the conversation
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    if (conversation.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Conversation already ended' },
        { status: 400 }
      );
    }
    
    // Calculate duration
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - conversation.startTime.getTime()) / 1000
    );
    
    // Update conversation
    const result = await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          status: 'completed',
          endTime,
          duration,
          updatedAt: endTime,
        },
      }
    );
    
    if (result.modifiedCount === 0) {
      throw new Error('Failed to update conversation');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: conversationId,
        status: 'completed',
        endTime,
        duration,
      },
    });
  } catch (error) {
    console.error('Failed to end conversation:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end conversation',
      },
      { status: 500 }
    );
  }
}