import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/db';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Get conversation
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(id),
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get all utterances
    const utterances = await db
      .collection('utterances')
      .find({ conversationId: new ObjectId(id) })
      .sort({ sequenceNumber: 1 })
      .toArray();

    // Get all actions
    const actions = await db
      .collection('actions')
      .find({ conversationId: new ObjectId(id) })
      .toArray();

    // Format the response
    const formattedUtterances = utterances.map(u => ({
      id: u._id.toString(),
      role: u.role,
      originalText: u.originalText,
      translatedText: u.translatedText,
      language: u.originalLanguage,
      timestamp: u.timestamp,
      sequenceNumber: u.sequenceNumber,
    }));

    const formattedActions = actions.map(a => ({
      id: a._id.toString(),
      type: a.type,
      details: a.details,
      confidence: a.confidence,
      validated: a.validated,
      webhook: a.webhook,
    }));

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        startedAt: conversation.startedAt,
        endedAt: conversation.endedAt,
        languages: conversation.languages,
      },
      utterances: formattedUtterances,
      actions: formattedActions,
    });
  } catch (error) {
    console.error('Failed to fetch conversation details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch conversation details' 
      },
      { status: 500 }
    );
  }
}