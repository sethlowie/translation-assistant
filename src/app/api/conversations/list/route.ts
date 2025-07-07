import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/db';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Get all conversations, sorted by most recent first
    const conversations = await db
      .collection('conversations')
      .find({})
      .sort({ startedAt: -1 })
      .limit(50) // Limit to last 50 conversations
      .toArray();

    // Get utterance counts for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv) => {
        const utteranceCount = await db
          .collection('utterances')
          .countDocuments({ conversationId: conv._id });

        const actionCount = await db
          .collection('actions')
          .countDocuments({ conversationId: conv._id });

        return {
          id: conv._id.toString(),
          startedAt: conv.startedAt,
          endedAt: conv.endedAt,
          languages: conv.languages || { primary: 'en', secondary: 'es' },
          utteranceCount,
          actionCount,
          hasSummary: !!conv.summaryId,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: conversationsWithCounts,
    });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch conversations' 
      },
      { status: 500 }
    );
  }
}