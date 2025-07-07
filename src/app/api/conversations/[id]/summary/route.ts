import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/db';
import { ObjectId } from 'mongodb';
import { SummaryGenerator } from '@/lib/server/summaries/generator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if conversation exists
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(id),
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if summary already exists
    const existingSummary = await db.collection('summaries').findOne({
      conversationId: new ObjectId(id),
    });

    if (existingSummary) {
      return NextResponse.json({
        success: true,
        summary: {
          id: existingSummary._id.toString(),
          ...existingSummary,
        },
        existing: true,
      });
    }

    // Generate new summary
    const generator = new SummaryGenerator();
    const summaryData = await generator.generateSummary(id);
    
    // Save to database
    const result = await db.collection('summaries').insertOne(summaryData);
    
    // Update conversation with summary reference
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { summaryId: result.insertedId } }
    );

    return NextResponse.json({
      success: true,
      summary: {
        id: result.insertedId.toString(),
        ...summaryData,
      },
      existing: false,
    });
  } catch (error) {
    console.error('Summary generation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate summary' 
      },
      { status: 500 }
    );
  }
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
    
    const summary = await db.collection('summaries').findOne({
      conversationId: new ObjectId(id),
    });

    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Summary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: {
        id: summary._id.toString(),
        ...summary,
      },
    });
  } catch (error) {
    console.error('Failed to fetch summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch summary' 
      },
      { status: 500 }
    );
  }
}