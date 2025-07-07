import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/db';
import { ObjectId } from 'mongodb';
import { WebhookExecutor } from '@/lib/server/webhooks/executor';
import { ActionDocument } from '@/lib/schemas/action.schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { conversationId } = await request.json();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Get the action
    const action = await db.collection('actions').findOne({
      _id: new ObjectId(id),
      conversationId: new ObjectId(conversationId),
    });

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    // Update action as validated
    const updateResult = await db.collection('actions').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          validated: true,
          validatedAt: new Date(),
        } 
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update action' },
        { status: 500 }
      );
    }

    // Check if webhooks are enabled and configured
    const webhookUrl = request.headers.get('x-webhook-url');
    
    if (webhookUrl) {
      console.log('[Webhook] Sending validated action to:', webhookUrl);
      
      // Execute webhook asynchronously
      const executor = new WebhookExecutor();
      executor.executeWebhook(action as ActionDocument, webhookUrl).then(result => {
        if (result.success) {
          console.log('[Webhook] Successfully sent to webhook');
          // Update action with webhook status
          db.collection('actions').updateOne(
            { _id: new ObjectId(id) },
            { 
              $set: { 
                'webhook.status': 'sent',
                'webhook.sentAt': new Date(),
                'webhook.response': result.response,
              } 
            }
          );
        } else {
          console.error('[Webhook] Failed to send:', result.error);
          // Update action with webhook error
          db.collection('actions').updateOne(
            { _id: new ObjectId(id) },
            { 
              $set: { 
                'webhook.status': 'failed',
                'webhook.error': result.error,
                'webhook.attemptedAt': new Date(),
              } 
            }
          );
        }
      }).catch(error => {
        console.error('[Webhook] Unexpected error:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Action validated successfully',
      webhookTriggered: !!webhookUrl,
    });
  } catch (error) {
    console.error('Action validation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate action' 
      },
      { status: 500 }
    );
  }
}