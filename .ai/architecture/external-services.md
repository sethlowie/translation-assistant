# External Services Architecture

## 🎯 Overview

All external services and non-deterministic behavior are abstracted behind interfaces, allowing easy swapping of providers and simplified testing.

## 🏗️ Architecture Principles

1. **Interface-First**: Define interfaces before implementations
2. **Provider Pattern**: Each external service has swappable providers
3. **Configuration-Driven**: Provider selection via environment/config
4. **Testability**: Easy mocking for unit tests
5. **Future-Proof**: Can switch providers without changing business logic

## 🔌 Service Interfaces

### AI/LLM Service Interface

```typescript
// lib/server/interfaces/ai-service.interface.ts
export interface IAIService {
  // Session management
  createRealtimeSession(config: RealtimeSessionConfig): Promise<RealtimeSession>;
  
  // Text generation
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
  
  // Embeddings
  createEmbedding(text: string): Promise<number[]>;
  
  // Transcription
  transcribeAudio(audio: Buffer, options?: TranscriptionOptions): Promise<Transcription>;
}

export interface RealtimeSessionConfig {
  model?: string;
  voice?: string;
  instructions?: string;
  temperature?: number;
  language?: {
    primary: string;
    secondary: string;
  };
}

export interface RealtimeSession {
  id: string;
  token: string;
  expiresAt: Date;
  config: RealtimeSessionConfig;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface Transcription {
  text: string;
  language: string;
  confidence: number;
  segments?: TranscriptionSegment[];
}
```

### Storage Service Interface

```typescript
// lib/server/interfaces/storage-service.interface.ts
export interface IStorageService {
  // File operations
  uploadFile(key: string, data: Buffer, metadata?: Record<string, string>): Promise<string>;
  downloadFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<boolean>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  
  // Bucket operations
  listFiles(prefix?: string): Promise<StorageFile[]>;
  fileExists(key: string): Promise<boolean>;
}

export interface StorageFile {
  key: string;
  size: number;
  lastModified: Date;
  metadata?: Record<string, string>;
}
```

### Webhook Service Interface

```typescript
// lib/server/interfaces/webhook-service.interface.ts
export interface IWebhookService {
  send(url: string, payload: any, options?: WebhookOptions): Promise<WebhookResponse>;
  sendBatch(webhooks: WebhookRequest[]): Promise<WebhookResponse[]>;
  validateSignature(payload: any, signature: string, secret: string): boolean;
}

export interface WebhookOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  signature?: {
    secret: string;
    algorithm: 'sha256' | 'sha512';
  };
}

export interface WebhookResponse {
  success: boolean;
  statusCode?: number;
  data?: any;
  error?: string;
  attempts: number;
}
```

### Email Service Interface

```typescript
// lib/server/interfaces/email-service.interface.ts
export interface IEmailService {
  sendEmail(email: EmailMessage): Promise<EmailResult>;
  sendBulk(emails: EmailMessage[]): Promise<EmailResult[]>;
  validateEmail(email: string): boolean;
}

export interface EmailMessage {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  metadata?: Record<string, string>;
}

export interface EmailResult {
  messageId: string;
  success: boolean;
  error?: string;
}
```

## 🔧 Provider Implementations

### OpenAI Provider

```typescript
// lib/server/providers/openai-ai.provider.ts
import { IAIService, RealtimeSession, RealtimeSessionConfig } from '../interfaces/ai-service.interface';
import { z } from 'zod';

export class OpenAIProvider implements IAIService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(config: OpenAIConfig) {
    // Validate config with Zod
    const validated = openAIConfigSchema.parse(config);
    this.apiKey = validated.apiKey;
    this.baseUrl = validated.baseUrl || 'https://api.openai.com/v1';
  }
  
  async createRealtimeSession(config: RealtimeSessionConfig): Promise<RealtimeSession> {
    const response = await fetch(`${this.baseUrl}/realtime/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-realtime-preview-2024-12-17',
        voice: config.voice || 'verse',
        instructions: config.instructions,
        temperature: config.temperature,
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          silence_duration_ms: 500
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      token: data.client_secret.value,
      expiresAt: new Date(Date.now() + 60000),
      config
    };
  }
  
  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4',
        messages: [
          ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature,
        max_tokens: options?.maxTokens
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  async createEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  }
  
  async transcribeAudio(audio: Buffer, options?: TranscriptionOptions): Promise<Transcription> {
    const formData = new FormData();
    formData.append('file', new Blob([audio]), 'audio.wav');
    formData.append('model', 'whisper-1');
    if (options?.language) {
      formData.append('language', options.language);
    }
    
    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      text: data.text,
      language: data.language || options?.language || 'en',
      confidence: 0.95, // OpenAI doesn't provide confidence
      segments: data.segments
    };
  }
}

const openAIConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional()
});
```

### Alternative AI Provider (Future)

```typescript
// lib/server/providers/anthropic-ai.provider.ts
export class AnthropicProvider implements IAIService {
  // Similar implementation for Anthropic's API
  // This demonstrates how we can swap providers
  
  async createRealtimeSession(config: RealtimeSessionConfig): Promise<RealtimeSession> {
    // Anthropic-specific implementation
    throw new Error('Realtime sessions not yet supported by Anthropic');
  }
  
  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    // Use Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature
      })
    });
    
    // ... handle response
  }
}
```

### S3-Compatible Storage Provider

```typescript
// lib/server/providers/s3-storage.provider.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { IStorageService, StorageFile } from '../interfaces/storage-service.interface';

export class S3StorageProvider implements IStorageService {
  private client: S3Client;
  private bucket: string;
  
  constructor(config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
    this.bucket = config.bucket;
  }
  
  async uploadFile(key: string, data: Buffer, metadata?: Record<string, string>): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      Metadata: metadata
    });
    
    await this.client.send(command);
    return `s3://${this.bucket}/${key}`;
  }
  
  async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    
    const response = await this.client.send(command);
    return Buffer.from(await response.Body!.transformToByteArray());
  }
  
  // ... other methods
}
```

## 💉 Dependency Injection Container Update

```typescript
// lib/server/container.ts
import { Container as BaseContainer } from './base-container';
import { IAIService } from './interfaces/ai-service.interface';
import { IStorageService } from './interfaces/storage-service.interface';
import { IWebhookService } from './interfaces/webhook-service.interface';
import { IEmailService } from './interfaces/email-service.interface';

export class Container extends BaseContainer {
  // External service instances
  private aiService?: IAIService;
  private storageService?: IStorageService;
  private webhookService?: IWebhookService;
  private emailService?: IEmailService;
  
  // AI Service (configurable provider)
  get ai(): IAIService {
    if (!this.aiService) {
      const provider = env.AI_PROVIDER || 'openai';
      
      switch (provider) {
        case 'openai':
          this.aiService = new OpenAIProvider({
            apiKey: env.OPENAI_API_KEY,
            baseUrl: env.OPENAI_BASE_URL
          });
          break;
        case 'anthropic':
          this.aiService = new AnthropicProvider({
            apiKey: env.ANTHROPIC_API_KEY
          });
          break;
        case 'mock':
          this.aiService = new MockAIProvider(); // For testing
          break;
        default:
          throw new Error(`Unknown AI provider: ${provider}`);
      }
    }
    return this.aiService;
  }
  
  // Storage Service
  get storage(): IStorageService {
    if (!this.storageService) {
      const provider = env.STORAGE_PROVIDER || 's3';
      
      switch (provider) {
        case 's3':
          this.storageService = new S3StorageProvider({
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            region: env.AWS_REGION,
            bucket: env.S3_BUCKET
          });
          break;
        case 'local':
          this.storageService = new LocalStorageProvider({
            basePath: env.LOCAL_STORAGE_PATH
          });
          break;
        case 'memory':
          this.storageService = new MemoryStorageProvider(); // For testing
          break;
        default:
          throw new Error(`Unknown storage provider: ${provider}`);
      }
    }
    return this.storageService;
  }
  
  // Webhook Service
  get webhook(): IWebhookService {
    if (!this.webhookService) {
      this.webhookService = new WebhookService({
        defaultTimeout: 30000,
        maxRetries: 3
      });
    }
    return this.webhookService;
  }
  
  // For testing - allow injection of mocks
  setAIService(service: IAIService): void {
    this.aiService = service;
  }
  
  setStorageService(service: IStorageService): void {
    this.storageService = service;
  }
}
```

## 🧪 Testing with Mocked External Services

```typescript
// __tests__/services/conversation.service.test.ts
import { Container } from '@/lib/server/container';
import { MockAIProvider } from '@/lib/server/mocks/ai.mock';
import { MockStorageProvider } from '@/lib/server/mocks/storage.mock';

describe('ConversationService with External Services', () => {
  let container: Container;
  let mockAI: MockAIProvider;
  let mockStorage: MockStorageProvider;
  
  beforeEach(() => {
    container = Container.getInstance();
    
    // Inject mocks
    mockAI = new MockAIProvider();
    mockStorage = new MockStorageProvider();
    
    container.setAIService(mockAI);
    container.setStorageService(mockStorage);
  });
  
  it('should create realtime session', async () => {
    // Arrange
    mockAI.createRealtimeSession.mockResolvedValue({
      id: 'session-123',
      token: 'mock-token',
      expiresAt: new Date(Date.now() + 60000),
      config: {}
    });
    
    // Act
    const service = container.conversationService;
    const session = await service.createSession({
      language: { primary: 'en', secondary: 'es' }
    });
    
    // Assert
    expect(mockAI.createRealtimeSession).toHaveBeenCalledWith({
      language: { primary: 'en', secondary: 'es' }
    });
    expect(session.token).toBe('mock-token');
  });
});
```

### Mock Provider Implementation

```typescript
// lib/server/mocks/ai.mock.ts
import { IAIService } from '../interfaces/ai-service.interface';

export class MockAIProvider implements IAIService {
  createRealtimeSession = jest.fn();
  generateCompletion = jest.fn();
  createEmbedding = jest.fn();
  transcribeAudio = jest.fn();
  
  // Can add default behaviors
  constructor() {
    this.generateCompletion.mockImplementation(async (prompt) => {
      return `Mock response to: ${prompt}`;
    });
    
    this.createEmbedding.mockImplementation(async () => {
      return new Array(1536).fill(0); // Mock embedding vector
    });
  }
}
```

## 🔄 Environment Configuration

```typescript
// src/env.js
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Database
    MONGODB_URI: z.string().url(),
    
    // AI Provider
    AI_PROVIDER: z.enum(['openai', 'anthropic', 'mock']).default('openai'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_BASE_URL: z.string().url().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    
    // Storage Provider
    STORAGE_PROVIDER: z.enum(['s3', 'local', 'memory']).default('s3'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    LOCAL_STORAGE_PATH: z.string().optional(),
    
    // Email Provider
    EMAIL_PROVIDER: z.enum(['sendgrid', 'ses', 'smtp', 'mock']).default('sendgrid'),
    SENDGRID_API_KEY: z.string().optional(),
    
    // Feature Flags
    ENABLE_WEBHOOKS: z.boolean().default(true),
    ENABLE_EMAIL_NOTIFICATIONS: z.boolean().default(false),
  },
  client: {},
  runtimeEnv: {
    MONGODB_URI: process.env.MONGODB_URI,
    AI_PROVIDER: process.env.AI_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    // ... etc
  },
});
```

## 🚀 Benefits of This Architecture

1. **Provider Flexibility**: Switch between OpenAI, Anthropic, or other providers with config change
2. **Cost Optimization**: Route different requests to different providers based on cost/performance
3. **Testing**: Easy to mock all external dependencies
4. **Resilience**: Can implement fallback providers
5. **Multi-tenancy**: Different customers can use different providers
6. **Compliance**: Can use region-specific providers for data residency

## 📊 Usage in API Routes

```typescript
// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/server/container';

export async function POST(request: NextRequest) {
  try {
    const container = getContainer();
    const aiService = container.ai;
    
    const body = await request.json();
    
    // Create session using whatever AI provider is configured
    const session = await aiService.createRealtimeSession({
      voice: body.voice,
      language: body.language,
      instructions: body.instructions
    });
    
    return NextResponse.json({
      success: true,
      data: {
        token: session.token,
        sessionId: session.id,
        expiresAt: session.expiresAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Session creation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
```