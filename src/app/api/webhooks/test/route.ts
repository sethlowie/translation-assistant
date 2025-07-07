import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl, testPayload } = await request.json();
    
    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    // Send test webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'medical.action.test',
        'X-Webhook-Timestamp': new Date().toISOString(),
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Webhook returned ${response.status}`,
          details: await response.text()
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent successfully',
      statusCode: response.status,
    });
  } catch (error) {
    console.error('Webhook test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send test webhook' 
      },
      { status: 500 }
    );
  }
}