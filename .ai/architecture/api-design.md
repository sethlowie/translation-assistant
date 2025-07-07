# API Design & Patterns

## 🎯 API Design Principles

1. **RESTful**: Follow REST conventions where applicable
2. **Predictable**: Consistent naming and response formats
3. **Secure**: Authentication-ready, validate all inputs
4. **Performant**: Optimize for real-time requirements
5. **Documented**: Clear error messages and status codes

## 🛣️ API Routes Overview

```
/api/
├── session/                    # WebRTC session management
│   ├── POST   /               # Create ephemeral token
│   └── DELETE /:id            # End session (future)
├── conversations/             # Conversation management
│   ├── GET    /               # List conversations
│   ├── POST   /               # Start conversation
│   ├── GET    /:id            # Get conversation details
│   ├── PUT    /:id            # Update conversation
│   └── POST   /:id/end        # End conversation
├── utterances/                # Speech segments
│   ├── POST   /               # Add utterance
│   └── GET    /conversation/:id # Get utterances
├── actions/                   # Medical actions
│   ├── GET    /               # List all actions
│   ├── POST   /detect         # Detect actions in text
│   ├── GET    /:id            # Get action details
│   ├── POST   /:id/validate   # Clinician validation
│   └── POST   /:id/webhook    # Retry webhook
├── summaries/                 # Clinical summaries
│   ├── POST   /generate       # Generate summary
│   ├── GET    /:conversationId # Get summary
│   └── PUT    /:id            # Update summary
└── health/                    # System status
    └── GET    /               # Health check
```

## 📝 Detailed Endpoint Specifications

### Session Management

#### `POST /api/session`
Create ephemeral token for WebRTC connection.

**Request:**
```typescript
{
  // Optional configuration overrides
  config?: {
    voice?: 'alloy' | 'echo' | 'shimmer' | 'verse';
    instructions?: string;
    temperature?: number;
    language?: {
      primary: 'en' | 'es';
      secondary: 'en' | 'es';
    };
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    token: string;              // Ephemeral token (60s TTL)
    expiresAt: string;         // ISO timestamp
    sessionId: string;         // OpenAI session ID
    config: {                  // Applied configuration
      model: string;
      voice: string;
      // ... full config
    }
  }
}
```

**Implementation:**
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create session with OpenAI
    const session = await openAIService.createSession({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: body.config?.voice || 'verse',
      instructions: body.config?.instructions || DEFAULT_INSTRUCTIONS,
      // ... other config
    });
    
    // Store session reference (optional)
    await sessionRepo.create({
      token: session.client_secret.value,
      openaiSessionId: session.id,
      expiresAt: new Date(Date.now() + 60000),
      config: session.config
    });
    
    return NextResponse.json({
      success: true,
      data: {
        token: session.client_secret.value,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        sessionId: session.id,
        config: session.config
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Conversation Management

#### `POST /api/conversations`
Start a new conversation session.

**Request:**
```typescript
{
  sessionId: string;           // From WebRTC session
  metadata?: {
    patientId?: string;
    visitType?: string;
    department?: string;
  };
  language: {
    primary: 'en' | 'es';
    secondary: 'en' | 'es';
  };
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;                // Conversation ID
    sessionId: string;
    startTime: string;         // ISO timestamp
    status: 'active';
  }
}
```

#### `POST /api/conversations/:id/end`
End conversation and generate summary.

**Request:**
```typescript
{
  generateSummary?: boolean;   // Default: true
  finalTranscript?: string;    // Optional client-side transcript
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    endTime: string;
    duration: number;          // Seconds
    utteranceCount: number;
    actionCount: number;
    summary?: {               // If requested
      id: string;
      content: object;
    };
  }
}
```

### Action Detection

#### `POST /api/actions/detect`
Detect medical actions in conversation text.

**Request:**
```typescript
{
  conversationId: string;
  text: string;               // Text to analyze
  utteranceId?: string;       // Link to specific utterance
  context?: {                 // Additional context
    previousActions?: Action[];
    patientHistory?: object;
  };
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    actions: Array<{
      id: string;
      type: string;
      confidence: number;
      details: object;
      suggestedWebhook?: string;
    }>;
    stats: {
      totalDetected: number;
      byType: Record<string, number>;
    };
  }
}
```

**Implementation Pattern:**
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate conversation exists
  const conversation = await conversationRepo.findById(body.conversationId);
  if (!conversation) {
    throw new ApiError('Conversation not found', 404);
  }
  
  // Detect actions using AI
  const detected = await actionDetector.analyze(body.text, {
    context: body.context,
    language: conversation.language
  });
  
  // Store detected actions
  const actions = await Promise.all(
    detected.map(action => 
      actionRepo.create({
        ...action,
        conversationId: body.conversationId,
        utteranceId: body.utteranceId,
        detectedAt: new Date()
      })
    )
  );
  
  // Queue webhooks
  await webhookQueue.addBatch(
    actions.filter(a => a.confidence > 0.8)
  );
  
  return NextResponse.json({
    success: true,
    data: { actions, stats: calculateStats(actions) }
  });
}
```

## 🔒 Authentication & Security

### Current (MVP)
```typescript
// No auth for MVP
export async function GET(request: Request) {
  // Process request directly
}
```

### Future Implementation
```typescript
// With authentication
export async function GET(request: Request) {
  // 1. Verify auth token
  const session = await verifyAuth(request);
  if (!session) {
    return unauthorized();
  }
  
  // 2. Check permissions
  if (!hasPermission(session, 'conversations.read')) {
    return forbidden();
  }
  
  // 3. Process request
  const data = await getConversations(session.clinicianId);
  
  // 4. Audit log
  await audit.log('conversations.list', session, data.length);
  
  return NextResponse.json({ success: true, data });
}
```

## 🎨 Response Formats

### Success Response
```typescript
{
  success: true,
  data: T,                    // Type varies by endpoint
  meta?: {                    // Optional metadata
    page?: number;
    limit?: number;
    total?: number;
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    message: string;          // Human-readable message
    code: string;             // Machine-readable code
    details?: object;         // Additional context
  }
}
```

### Common Error Codes
```typescript
const ERROR_CODES = {
  // Client errors (4xx)
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FIELD: 'INVALID_FIELD',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  OPENAI_ERROR: 'OPENAI_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  WEBHOOK_ERROR: 'WEBHOOK_ERROR'
};
```

## 🚦 Rate Limiting

### Implementation
```typescript
// lib/server/middleware/rate-limit.ts
const rateLimiter = new Map<string, { count: number; reset: number }>();

export function rateLimit(
  limit: number = 100,
  window: number = 60000  // 1 minute
) {
  return async (request: Request) => {
    const ip = getClientIp(request);
    const now = Date.now();
    
    const current = rateLimiter.get(ip);
    if (!current || current.reset < now) {
      rateLimiter.set(ip, { count: 1, reset: now + window });
      return;
    }
    
    if (current.count >= limit) {
      throw new ApiError('Rate limit exceeded', 429, 'RATE_LIMITED');
    }
    
    current.count++;
  };
}
```

## 🔄 Webhook Patterns

### Webhook Payload
```typescript
{
  event: 'action.detected',
  timestamp: string;
  data: {
    action: {
      id: string;
      type: string;
      details: object;
    };
    conversation: {
      id: string;
      sessionId: string;
    };
    metadata: object;
  };
  signature: string;          // HMAC for verification
}
```

### Webhook Execution
```typescript
async function executeWebhook(action: Action, url: string) {
  const payload = {
    event: 'action.detected',
    timestamp: new Date().toISOString(),
    data: { action, conversation: await getConversation(action.conversationId) }
  };
  
  const signature = createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000)  // 30s timeout
    });
    
    return {
      status: response.status,
      body: await response.text()
    };
  } catch (error) {
    // Implement retry logic
    throw error;
  }
}
```

## 📊 API Monitoring

### Health Check
```typescript
// api/health/route.ts
export async function GET() {
  const checks = {
    api: 'healthy',
    database: await checkDatabase(),
    openai: await checkOpenAI(),
    timestamp: new Date().toISOString()
  };
  
  const isHealthy = Object.values(checks).every(
    v => v === 'healthy' || typeof v === 'string'
  );
  
  return NextResponse.json(
    checks,
    { status: isHealthy ? 200 : 503 }
  );
}
```

### Metrics Collection
```typescript
// Track API performance
export function trackApiCall(
  endpoint: string,
  method: string,
  duration: number,
  status: number
) {
  metrics.record({
    endpoint,
    method,
    duration,
    status,
    timestamp: Date.now()
  });
}
```