import { createHmac } from 'crypto';
import { ActionDocument } from '@/lib/schemas/action.schema';

// Action detail types from schema
interface PrescriptionDetails {
  medication: {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    rxnormCode?: string;
  };
}

interface LabOrderDetails {
  labTest: {
    name: string;
    loincCode?: string;
    urgency?: string;
  };
}

interface ReferralDetails {
  referral: {
    specialty: string;
    reason: string;
    urgency: string;
  };
}

interface FollowUpDetails {
  followUp: {
    timeframe: string;
    reason: string;
  };
}

interface DiagnosticTestDetails {
  test: {
    name: string;
    type?: string;
    urgency?: string;
  };
}

type ActionDetails = PrescriptionDetails | LabOrderDetails | ReferralDetails | FollowUpDetails | DiagnosticTestDetails;

export interface WebhookPayload {
  event: 'medical.action.detected';
  action: {
    id: string;
    type: string;
    details: ActionDetails;
    confidence: number;
  };
  conversation: {
    id: string;
  };
  timestamp: string;
}

export class WebhookExecutor {
  private webhookSecret: string;
  private timeout: number;

  constructor() {
    this.webhookSecret = process.env.WEBHOOK_SECRET || 'default-webhook-secret';
    this.timeout = parseInt(process.env.WEBHOOK_TIMEOUT_MS || '30000', 10);
  }

  async executeWebhook(
    action: ActionDocument,
    webhookUrl: string
  ): Promise<{ success: boolean; response?: unknown; error?: string }> {
    try {
      const payload: WebhookPayload = {
        event: 'medical.action.detected',
        action: {
          id: action._id.toString(),
          type: action.type,
          details: action.details,
          confidence: action.confidence,
        },
        conversation: {
          id: action.conversationId.toString(),
        },
        timestamp: new Date().toISOString(),
      };

      const signature = this.generateSignature(payload);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': 'medical.action.detected',
            'X-Webhook-Timestamp': payload.timestamp,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData = await response.text();
        let parsedResponse;
        
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { body: responseData };
        }

        if (!response.ok) {
          return {
            success: false,
            error: `Webhook returned ${response.status}: ${responseData}`,
            response: parsedResponse,
          };
        }

        return {
          success: true,
          response: parsedResponse,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            success: false,
            error: `Webhook timeout after ${this.timeout}ms`,
          };
        }
        
        throw error;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown webhook error',
      };
    }
  }

  private generateSignature(payload: WebhookPayload): string {
    const payloadString = JSON.stringify(payload);
    const hmac = createHmac('sha256', this.webhookSecret);
    hmac.update(payloadString);
    return `sha256=${hmac.digest('hex')}`;
  }

  // Verify webhook signature for incoming webhooks (if needed)
  verifySignature(signature: string, payload: unknown): boolean {
    const expectedSignature = this.generateSignature(payload as WebhookPayload);
    return signature === expectedSignature;
  }
}

// Webhook retry logic with exponential backoff
export class WebhookQueue {
  private executor: WebhookExecutor;
  private maxRetries: number = 3;
  private baseDelay: number = 2000; // 2 seconds

  constructor() {
    this.executor = new WebhookExecutor();
  }

  async processWebhook(
    action: ActionDocument,
    webhookUrl: string,
    attempt: number = 1
  ): Promise<void> {
    const result = await this.executor.executeWebhook(action, webhookUrl);

    if (result.success) {
      // Update action with successful webhook
      await this.updateActionWebhookStatus(action._id.toString(), {
        status: 'sent',
        response: result.response,
        attempts: attempt,
        lastAttempt: new Date(),
      });
      return;
    }

    if (attempt >= this.maxRetries) {
      // Max retries reached, mark as failed
      await this.updateActionWebhookStatus(action._id.toString(), {
        status: 'failed',
        error: result.error,
        attempts: attempt,
        lastAttempt: new Date(),
      });
      return;
    }

    // Calculate exponential backoff delay
    const delay = this.baseDelay * Math.pow(2, attempt - 1);
    
    // Schedule retry
    setTimeout(() => {
      this.processWebhook(action, webhookUrl, attempt + 1);
    }, delay);
  }

  private async updateActionWebhookStatus(
    actionId: string,
    webhookUpdate: {
      status: 'sent' | 'failed';
      response?: unknown;
      error?: string;
      attempts: number;
      lastAttempt: Date;
    }
  ): Promise<void> {
    // This would update the action in the database
    // For now, we'll just log it
    console.log('Updating action webhook status:', { actionId, webhookUpdate });
  }
}