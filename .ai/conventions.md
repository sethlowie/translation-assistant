# Coding Conventions & Standards

## 📁 File Structure

### Directory Organization
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── [endpoint]/    # Endpoint folder
│   │       └── route.ts   # HTTP handlers
│   ├── (routes)/          # Page routes
│   └── components/        # Page-specific components
├── components/            # Shared components
│   └── [ComponentName]/   # Component folder
│       ├── index.tsx      # Main component
│       └── styles.css     # Component styles (if needed)
├── lib/                   # Utilities & helpers
│   ├── server/           # Server-only code
│   └── client/           # Client-only code
└── types/                # TypeScript type definitions
```

### Naming Conventions
- **Files**: `kebab-case.ts` (except components)
- **Components**: `PascalCase.tsx`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

## 🔷 TypeScript Standards

### Strict Mode Required
```typescript
// tsconfig.json enforces:
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

### Type Definitions

✅ **Good - Explicit types**:
```typescript
interface SessionConfig {
  model: string;
  voice: 'alloy' | 'echo' | 'shimmer' | 'verse';
  temperature?: number;
}

export async function createSession(config: SessionConfig): Promise<Session> {
  // Implementation
}
```

❌ **Avoid - Implicit any**:
```typescript
export async function createSession(config) {  // Missing types!
  return await fetch('/api/session', { body: config });
}
```

### Async/Await Pattern
```typescript
// Always use try-catch for async operations
export async function fetchData(): Promise<Result> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
```

## 🎨 React/Next.js Patterns

### Component Structure
```typescript
// components/VoiceChat/index.tsx
'use client';  // Only if using browser APIs

import { useState, useEffect } from 'react';
import type { FC } from 'react';

interface VoiceChatProps {
  onSessionEnd?: (transcript: string) => void;
  language?: 'en' | 'es';
}

export const VoiceChat: FC<VoiceChatProps> = ({ 
  onSessionEnd,
  language = 'en' 
}) => {
  // 1. State declarations
  const [isConnected, setIsConnected] = useState(false);
  
  // 2. Effects
  useEffect(() => {
    // Cleanup required
    return () => {
      // Cleanup logic
    };
  }, []);
  
  // 3. Handlers
  const handleStart = async () => {
    // Implementation
  };
  
  // 4. Render
  return (
    <div className="voice-chat">
      {/* JSX */}
    </div>
  );
};
```

### Server Components vs Client Components
```typescript
// Default to server components
// app/page.tsx
export default async function Page() {
  const data = await fetchFromDB();  // Server-side data fetching
  return <ClientComponent initialData={data} />;
}

// Mark client components explicitly
// components/InteractiveWidget.tsx
'use client';
export function InteractiveWidget() {
  const [state, setState] = useState();  // Client-side state
  return <div onClick={() => setState(true)} />;
}
```

## 🗄️ Database Patterns

### Key Principles
1. **No ORM** - Use MongoDB driver directly
2. **Zod Validation** - All data validated in/out of DB
3. **Repository Pattern** - DB operations isolated
4. **Service Layer** - Business logic separated
5. **Dependency Injection** - Easy to test and swap implementations

### Repository Pattern with Zod
```typescript
// lib/server/repositories/conversation.repository.ts
import { Db } from 'mongodb';
import { BaseRepository } from './base.repository';
import { 
  ConversationDocument,
  conversationCreateSchema,
  conversationUpdateSchema 
} from '@/lib/schemas/conversation.schema';

export class ConversationRepository extends BaseRepository<ConversationDocument> {
  constructor(db: Db) {
    super(
      db, 
      'conversations', 
      conversationCreateSchema,
      conversationUpdateSchema
    );
  }
  
  async findByPatient(patientId: string): Promise<ConversationDocument[]> {
    return this.findMany({ patientId });
  }
}
```

### Service Layer with Business Logic
```typescript
// lib/server/services/conversation.service.ts
export class ConversationService extends BaseService<ConversationDocument> {
  constructor(
    protected repository: IConversationRepository,
    private utteranceRepository: IUtteranceRepository,
    private summaryGenerator: ISummaryGenerator
  ) {
    super(repository);
  }

  async endConversation(id: string): Promise<ConversationEndResult> {
    // Business logic validation
    const conversation = await this.repository.findById(id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    if (conversation.status !== 'active') {
      throw new Error('Conversation already ended');
    }
    
    // Update status
    await this.repository.endConversation(id);
    
    // Generate summary
    const summary = await this.summaryGenerator.generate(id);
    
    return { conversation, summary };
  }
}
```

### Zod Schema Definition
```typescript
// lib/schemas/conversation.schema.ts
import { z } from 'zod';

export const conversationCreateSchema = z.object({
  sessionId: z.string().min(1),
  clinicianId: z.string().optional(),
  patientId: z.string().optional(),
  startTime: z.date(),
  status: z.literal('active'),
  language: z.object({
    primary: z.enum(['en', 'es']),
    secondary: z.enum(['en', 'es'])
  }),
  metadata: z.object({
    location: z.string().optional(),
    visitType: z.string().optional(),
    department: z.string().optional()
  }).optional()
});

export type ConversationCreate = z.infer<typeof conversationCreateSchema>;
```

### Dependency Injection Container
```typescript
// lib/server/container.ts
export class Container {
  private static instance: Container;
  private db: Db;
  
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
  
  get conversationService(): ConversationService {
    return new ConversationService(
      this.conversationRepository,
      this.utteranceRepository,
      this.summaryGenerator
    );
  }
}

// Usage in API routes
const container = getContainer();
const service = container.conversationService;
```

### External Service Pattern
```typescript
// lib/server/interfaces/ai-service.interface.ts
export interface IAIService {
  createRealtimeSession(config: RealtimeSessionConfig): Promise<RealtimeSession>;
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
  createEmbedding(text: string): Promise<number[]>;
  transcribeAudio(audio: Buffer, options?: TranscriptionOptions): Promise<Transcription>;
}

// lib/server/providers/openai-ai.provider.ts
export class OpenAIProvider implements IAIService {
  constructor(private config: OpenAIConfig) {
    // Validate config with Zod
  }
  
  async createRealtimeSession(config: RealtimeSessionConfig): Promise<RealtimeSession> {
    // OpenAI-specific implementation
  }
}

// Usage via container
const container = getContainer();
const ai = container.ai; // Returns configured provider
const session = await ai.createRealtimeSession(config);
```

## 🔌 API Design

### RESTful Routes
```typescript
// app/api/conversations/route.ts
export async function GET(request: Request) {
  // List conversations
}

export async function POST(request: Request) {
  // Create conversation
}

// app/api/conversations/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Get single conversation
}
```

### Error Handling
```typescript
// lib/server/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

// Usage in API routes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validation
    if (!body.sessionId) {
      throw new ApiError('Session ID required', 400, 'MISSING_SESSION_ID');
    }
    // Process...
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🎯 Best Practices

### 1. Environment Variables
```typescript
// Use env.js for validation
import { env } from '@/env';

// Never do this:
const apiKey = process.env.OPENAI_API_KEY;  // Unvalidated!

// Always do this:
const apiKey = env.OPENAI_API_KEY;  // Validated & typed
```

### 2. Error Boundaries
```typescript
// components/ErrorBoundary.tsx
export function ErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode;
  fallback?: ComponentType<{ error: Error }>;
}) {
  // Implementation
}
```

### 3. Loading States
```typescript
// Always handle loading states
function MyComponent() {
  const { data, isLoading, error } = useQuery();
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
}
```

### 4. Cleanup Requirements
```typescript
// Always cleanup subscriptions/connections
useEffect(() => {
  const ws = new WebSocket(url);
  
  return () => {
    ws.close();  // Cleanup!
  };
}, [url]);
```

## 🚫 Anti-Patterns to Avoid

1. **No `any` types** without explanation
2. **No console.log** in production code
3. **No direct DOM manipulation** in React
4. **No synchronous I/O** in server code
5. **No hardcoded secrets** ever
6. **No missing error handling** for async code
7. **No unused imports** or variables

## ✅ Pre-Commit Checklist

Before committing, always run:
```bash
pnpm check          # TypeScript validation
pnpm lint          # ESLint checks
pnpm build         # Ensure it builds
```

Add this git hook for automation:
```bash
# .git/hooks/pre-commit
#!/bin/sh
pnpm check || exit 1
```