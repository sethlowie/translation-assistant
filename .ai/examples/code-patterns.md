# Code Patterns & Examples

## 🎯 Common Patterns for This Project

### 1. API Route Pattern

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define request schema
const requestSchema = z.object({
  field1: z.string(),
  field2: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate body
    const body = await request.json();
    const validated = requestSchema.parse(body);
    
    // 2. Perform business logic
    const result = await someService.process(validated);
    
    // 3. Return success response
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    // 4. Handle errors consistently
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. Repository Pattern with Zod Validation

```typescript
// lib/server/repositories/base.repository.ts
import { Collection, Db, Filter, OptionalId, WithId, ObjectId } from 'mongodb';
import { z } from 'zod';

export interface IRepository<T> {
  create(data: OptionalId<T>): Promise<WithId<T>>;
  findById(id: string): Promise<WithId<T> | null>;
  findOne(filter: Filter<T>): Promise<WithId<T> | null>;
  findMany(filter?: Filter<T>): Promise<WithId<T>[]>;
  update(id: string, data: Partial<T>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export abstract class BaseRepository<T> implements IRepository<T> {
  protected collection: Collection<T>;
  
  constructor(
    protected db: Db,
    protected collectionName: string,
    protected createSchema: z.ZodSchema,
    protected updateSchema: z.ZodSchema
  ) {
    this.collection = db.collection<T>(collectionName);
  }
  
  async create(data: OptionalId<T>): Promise<WithId<T>> {
    // Validate with Zod before inserting
    const validated = this.createSchema.parse(data);
    
    const result = await this.collection.insertOne(validated);
    
    return {
      ...validated,
      _id: result.insertedId
    } as WithId<T>;
  }
  
  async findById(id: string): Promise<WithId<T> | null> {
    try {
      const objectId = new ObjectId(id);
      return await this.collection.findOne({ _id: objectId } as Filter<T>);
    } catch {
      return null; // Invalid ObjectId format
    }
  }
  
  async findOne(filter: Filter<T>): Promise<WithId<T> | null> {
    return await this.collection.findOne(filter);
  }
  
  async findMany(filter: Filter<T> = {}): Promise<WithId<T>[]> {
    return await this.collection.find(filter).toArray();
  }
  
  async update(id: string, data: Partial<T>): Promise<boolean> {
    // Validate update data
    const validated = this.updateSchema.parse(data);
    
    // Always update the updatedAt timestamp
    const updateData = {
      ...validated,
      updatedAt: new Date()
    };
    
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) } as Filter<T>,
      { $set: updateData }
    );
    
    return result.modifiedCount > 0;
  }
  
  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne(
      { _id: new ObjectId(id) } as Filter<T>
    );
    
    return result.deletedCount > 0;
  }
  
  // Helper method for creating indexes
  async createIndexes(indexes: any[]): Promise<void> {
    await this.collection.createIndexes(indexes);
  }
}

// lib/server/repositories/conversation.repository.ts
import { Db } from 'mongodb';
import { BaseRepository } from './base.repository';
import { 
  ConversationDocument,
  conversationCreateSchema,
  conversationUpdateSchema 
} from '@/lib/schemas/conversation.schema';

export interface IConversationRepository extends IRepository<ConversationDocument> {
  findActive(): Promise<ConversationDocument[]>;
  findByClinicianId(clinicianId: string): Promise<ConversationDocument[]>;
  endConversation(id: string): Promise<boolean>;
}

export class ConversationRepository 
  extends BaseRepository<ConversationDocument> 
  implements IConversationRepository {
  
  constructor(db: Db) {
    super(
      db, 
      'conversations', 
      conversationCreateSchema,
      conversationUpdateSchema
    );
    
    // Create indexes on initialization
    this.createIndexes([
      { key: { sessionId: 1 }, unique: true },
      { key: { clinicianId: 1 } },
      { key: { startTime: -1 } },
      { key: { status: 1 } }
    ]);
  }
  
  async findActive(): Promise<ConversationDocument[]> {
    return this.findMany({ status: 'active' });
  }
  
  async findByClinicianId(clinicianId: string): Promise<ConversationDocument[]> {
    return this.findMany({ clinicianId });
  }
  
  async endConversation(id: string): Promise<boolean> {
    const endTime = new Date();
    const conversation = await this.findById(id);
    
    if (!conversation) return false;
    
    const duration = Math.floor(
      (endTime.getTime() - conversation.startTime.getTime()) / 1000
    );
    
    return this.update(id, {
      status: 'completed',
      endTime,
      duration
    });
  }
}
```

### 3. Service Pattern

```typescript
// lib/server/services/base.service.ts
export abstract class BaseService<T> {
  constructor(protected repository: BaseRepository<T>) {}
  
  async create(data: Omit<T, '_id'>): Promise<WithId<T>> {
    // Add business logic, validation, etc.
    return this.repository.create(data);
  }
  
  async findById(id: string): Promise<WithId<T> | null> {
    return this.repository.findById(id);
  }
}

// lib/server/services/conversation.service.ts
export class ConversationService extends BaseService<Conversation> {
  constructor(
    repository: ConversationRepository,
    private summaryGenerator: SummaryGenerator,
    private actionDetector: ActionDetector
  ) {
    super(repository);
  }
  
  async endConversation(id: string, options?: EndOptions): Promise<EndResult> {
    // Business logic
    const conversation = await this.repository.findById(id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // End conversation
    await this.repository.endConversation(id);
    
    // Generate summary if requested
    let summary;
    if (options?.generateSummary) {
      summary = await this.summaryGenerator.generate(id);
    }
    
    // Detect final actions
    const actions = await this.actionDetector.detectFinal(id);
    
    return { conversation, summary, actions };
  }
}
```

### 4. React Hook Pattern

```typescript
// lib/client/hooks/useWebRTC.ts
export function useWebRTC() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);
  
  const connect = useCallback(async (config?: ConnectionConfig) => {
    try {
      setStatus('connecting');
      setError(null);
      
      if (!clientRef.current) {
        clientRef.current = new RealtimeClient();
      }
      
      await clientRef.current.connect(config);
      setStatus('connected');
      
    } catch (err) {
      setError(err as Error);
      setStatus('error');
      throw err;
    }
  }, []);
  
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setStatus('idle');
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);
  
  return {
    status,
    error,
    connect,
    disconnect,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting'
  };
}
```

### 5. Error Handling Pattern

```typescript
// lib/server/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// Usage in API route
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await conversationService.findById(params.id);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }
    
    return NextResponse.json({ success: true, data: conversation });
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    
    // Unknown errors
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 6. WebRTC Event Handler Pattern

```typescript
// lib/client/webrtc/RealtimeClient.ts
export class RealtimeClient extends EventEmitter {
  private handlers = new Map<string, EventHandler>();
  
  constructor() {
    super();
    this.setupHandlers();
  }
  
  private setupHandlers() {
    // Register handlers for different event types
    this.handlers.set('conversation.item.created', this.handleConversationItem);
    this.handlers.set('error', this.handleError);
    this.handlers.set('session.updated', this.handleSessionUpdate);
  }
  
  private handleRealtimeEvent = (event: RealtimeEvent) => {
    const handler = this.handlers.get(event.type);
    if (handler) {
      handler.call(this, event);
    } else {
      console.warn(`Unhandled event type: ${event.type}`);
    }
    
    // Emit for external listeners
    this.emit(event.type, event);
  };
  
  private handleConversationItem = (event: ConversationItemEvent) => {
    if (event.item.role === 'user') {
      this.emit('userSpoke', {
        text: event.item.content?.[0]?.transcript,
        timestamp: new Date()
      });
    } else if (event.item.role === 'assistant') {
      this.emit('assistantSpoke', {
        text: event.item.content?.[0]?.transcript,
        timestamp: new Date()
      });
    }
  };
}
```

### 7. Redux Slice Pattern

```typescript
// lib/client/store/slices/conversationSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const startConversation = createAsyncThunk(
  'conversation/start',
  async (config: ConversationConfig) => {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) throw new Error('Failed to start conversation');
    
    const data = await response.json();
    return data.data;
  }
);

// Slice
const conversationSlice = createSlice({
  name: 'conversation',
  initialState: {
    id: null as string | null,
    status: 'idle' as ConversationStatus,
    utterances: [] as Utterance[],
    actions: [] as Action[],
    loading: false,
    error: null as string | null
  },
  reducers: {
    addUtterance: (state, action: PayloadAction<Utterance>) => {
      state.utterances.push(action.payload);
    },
    addAction: (state, action: PayloadAction<Action>) => {
      state.actions.push(action.payload);
    },
    clearConversation: (state) => {
      state.id = null;
      state.status = 'idle';
      state.utterances = [];
      state.actions = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.id = action.payload.id;
        state.status = 'active';
      })
      .addCase(startConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to start conversation';
      });
  }
});

export const { addUtterance, addAction, clearConversation } = conversationSlice.actions;
export default conversationSlice.reducer;
```

### 8. External Service Provider Pattern

```typescript
// lib/server/interfaces/ai-service.interface.ts
export interface IAIService {
  createRealtimeSession(config: RealtimeSessionConfig): Promise<RealtimeSession>;
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
  createEmbedding(text: string): Promise<number[]>;
  transcribeAudio(audio: Buffer, options?: TranscriptionOptions): Promise<Transcription>;
}

// lib/server/providers/openai-ai.provider.ts
import { IAIService } from '../interfaces/ai-service.interface';
import { z } from 'zod';

const openAIConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  organization: z.string().optional()
});

export class OpenAIProvider implements IAIService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(config: unknown) {
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
        instructions: config.instructions
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      token: data.client_secret.value,
      expiresAt: new Date(Date.now() + 60000),
      config
    };
  }
  
  // Other methods...
}

// lib/server/providers/mock-ai.provider.ts
export class MockAIProvider implements IAIService {
  private responses: Map<string, any> = new Map();
  
  async createRealtimeSession(config: RealtimeSessionConfig): Promise<RealtimeSession> {
    return {
      id: 'mock-session-123',
      token: 'mock-token-abc',
      expiresAt: new Date(Date.now() + 60000),
      config
    };
  }
  
  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    // Return mocked response
    const key = `${prompt}-${JSON.stringify(options)}`;
    return this.responses.get(key) || `Mock response to: ${prompt}`;
  }
  
  // Helper for tests
  setResponse(prompt: string, options: CompletionOptions | undefined, response: string): void {
    const key = `${prompt}-${JSON.stringify(options)}`;
    this.responses.set(key, response);
  }
}

// lib/server/container.ts - External service configuration
export class Container {
  private aiService?: IAIService;
  
  get ai(): IAIService {
    if (!this.aiService) {
      const provider = env.AI_PROVIDER || 'openai';
      
      switch (provider) {
        case 'openai':
          this.aiService = new OpenAIProvider({
            apiKey: env.OPENAI_API_KEY,
            baseUrl: env.OPENAI_BASE_URL,
            organization: env.OPENAI_ORG_ID
          });
          break;
        
        case 'anthropic':
          this.aiService = new AnthropicProvider({
            apiKey: env.ANTHROPIC_API_KEY
          });
          break;
          
        case 'azure':
          this.aiService = new AzureOpenAIProvider({
            apiKey: env.AZURE_OPENAI_KEY,
            endpoint: env.AZURE_OPENAI_ENDPOINT,
            deployment: env.AZURE_OPENAI_DEPLOYMENT
          });
          break;
          
        case 'mock':
          this.aiService = new MockAIProvider();
          break;
          
        default:
          throw new Error(`Unknown AI provider: ${provider}`);
      }
    }
    return this.aiService;
  }
  
  // For testing
  setAIService(service: IAIService): void {
    this.aiService = service;
  }
}
```

### Usage in Services

```typescript
// lib/server/services/session.service.ts
export class SessionService {
  constructor(
    private ai: IAIService,
    private sessionRepository: ISessionRepository
  ) {}
  
  async createSession(config: SessionConfig): Promise<Session> {
    // Use AI service through interface
    const realtimeSession = await this.ai.createRealtimeSession({
      voice: config.voice,
      language: config.language,
      instructions: this.buildInstructions(config)
    });
    
    // Store session info
    const session = await this.sessionRepository.create({
      openaiSessionId: realtimeSession.id,
      token: realtimeSession.token,
      expiresAt: realtimeSession.expiresAt,
      config
    });
    
    return session;
  }
  
  private buildInstructions(config: SessionConfig): string {
    return `You are a medical interpreter...`;
  }
}

// Usage in API route
export async function POST(request: NextRequest) {
  const container = getContainer();
  const sessionService = new SessionService(
    container.ai,
    container.sessionRepository
  );
  
  const body = await request.json();
  const session = await sessionService.createSession(body);
  
  return NextResponse.json({ success: true, data: session });
}
```

### Testing with Mocked Providers

```typescript
// __tests__/services/session.service.test.ts
describe('SessionService', () => {
  let service: SessionService;
  let mockAI: MockAIProvider;
  let mockSessionRepo: jest.Mocked<ISessionRepository>;
  
  beforeEach(() => {
    mockAI = new MockAIProvider();
    mockSessionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      // ... other methods
    };
    
    service = new SessionService(mockAI, mockSessionRepo);
  });
  
  it('should create session with AI provider', async () => {
    // Arrange
    const config = {
      voice: 'verse',
      language: { primary: 'en', secondary: 'es' }
    };
    
    mockSessionRepo.create.mockResolvedValue({
      _id: new ObjectId(),
      openaiSessionId: 'mock-session-123',
      token: 'mock-token-abc',
      expiresAt: new Date(Date.now() + 60000),
      config
    });
    
    // Act
    const session = await service.createSession(config);
    
    // Assert
    expect(session.token).toBe('mock-token-abc');
    expect(mockSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        openaiSessionId: 'mock-session-123'
      })
    );
  });
});
```

### 9. Component Composition Pattern

```typescript
// components/VoiceChat/index.tsx
export function VoiceChat() {
  return (
    <VoiceChatProvider>
      <div className="voice-chat-container">
        <ConnectionStatus />
        <LanguageSelector />
        <TranscriptDisplay />
        <ControlButtons />
        <ActionPanel />
      </div>
    </VoiceChatProvider>
  );
}

// components/VoiceChat/VoiceChatProvider.tsx
const VoiceChatContext = createContext<VoiceChatContextType | null>(null);

export function VoiceChatProvider({ children }: { children: ReactNode }) {
  const webrtc = useWebRTC();
  const dispatch = useDispatch();
  
  // Handle WebRTC events
  useEffect(() => {
    if (!webrtc.client) return;
    
    const handleUtterance = (data: UtteranceData) => {
      dispatch(addUtterance(data));
    };
    
    webrtc.client.on('utterance', handleUtterance);
    
    return () => {
      webrtc.client.off('utterance', handleUtterance);
    };
  }, [webrtc.client, dispatch]);
  
  return (
    <VoiceChatContext.Provider value={{ webrtc }}>
      {children}
    </VoiceChatContext.Provider>
  );
}

export const useVoiceChat = () => {
  const context = useContext(VoiceChatContext);
  if (!context) {
    throw new Error('useVoiceChat must be used within VoiceChatProvider');
  }
  return context;
};
```

## 🎯 Testing Patterns

### Unit Test Pattern with Dependency Injection
```typescript
// __tests__/services/conversation.service.test.ts
import { ConversationService } from '@/lib/server/services/conversation.service';
import { IConversationRepository } from '@/lib/server/repositories/conversation.repository';
import { IUtteranceRepository } from '@/lib/server/repositories/utterance.repository';
import { IActionDetector } from '@/lib/server/actions/detector';
import { ISummaryGenerator } from '@/lib/server/summaries/generator';

describe('ConversationService', () => {
  let service: ConversationService;
  let mockConversationRepo: jest.Mocked<IConversationRepository>;
  let mockUtteranceRepo: jest.Mocked<IUtteranceRepository>;
  let mockActionDetector: jest.Mocked<IActionDetector>;
  let mockSummaryGenerator: jest.Mocked<ISummaryGenerator>;
  
  beforeEach(() => {
    // Create mocks
    mockConversationRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findActive: jest.fn(),
      findByClinicianId: jest.fn(),
      endConversation: jest.fn()
    };
    
    mockUtteranceRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByConversationId: jest.fn()
    };
    
    mockActionDetector = {
      detectActions: jest.fn()
    };
    
    mockSummaryGenerator = {
      generateSummary: jest.fn()
    };
    
    // Inject mocks
    service = new ConversationService(
      mockConversationRepo,
      mockUtteranceRepo,
      mockActionDetector,
      mockSummaryGenerator
    );
  });
  
  describe('endConversation', () => {
    it('should end conversation and generate summary', async () => {
      // Arrange
      const mockConversation = { 
        _id: new ObjectId('507f1f77bcf86cd799439011'), 
        status: 'active',
        startTime: new Date()
      };
      const mockUtterances = [
        { _id: new ObjectId(), originalText: 'Test utterance' }
      ];
      const mockSummary = { content: 'Test summary' };
      
      mockConversationRepo.findById.mockResolvedValue(mockConversation);
      mockConversationRepo.endConversation.mockResolvedValue(true);
      mockUtteranceRepo.findByConversationId.mockResolvedValue(mockUtterances);
      mockActionDetector.detectActions.mockResolvedValue([]);
      mockSummaryGenerator.generateSummary.mockResolvedValue(mockSummary);
      
      // Act
      const result = await service.endConversation('507f1f77bcf86cd799439011', { 
        generateSummary: true 
      });
      
      // Assert
      expect(mockConversationRepo.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockConversationRepo.endConversation).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockSummaryGenerator.generateSummary).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result.summary).toEqual(mockSummary);
    });
    
    it('should throw error if conversation not found', async () => {
      // Arrange
      mockConversationRepo.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(service.endConversation('invalid-id')).rejects.toThrow('Conversation not found');
    });
    
    it('should throw error if conversation already ended', async () => {
      // Arrange
      const mockConversation = { 
        _id: new ObjectId(), 
        status: 'completed',
        startTime: new Date()
      };
      mockConversationRepo.findById.mockResolvedValue(mockConversation);
      
      // Act & Assert
      await expect(service.endConversation('123')).rejects.toThrow('Conversation already ended');
    });
  });
});
```

### Testing Repository with In-Memory MongoDB
```typescript
// __tests__/repositories/conversation.repository.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Db, MongoClient } from 'mongodb';
import { ConversationRepository } from '@/lib/server/repositories/conversation.repository';

describe('ConversationRepository', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let repository: ConversationRepository;
  
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test');
  });
  
  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });
  
  beforeEach(() => {
    repository = new ConversationRepository(db);
  });
  
  afterEach(async () => {
    // Clean up collections
    await db.collection('conversations').deleteMany({});
  });
  
  describe('create', () => {
    it('should create conversation with valid data', async () => {
      // Arrange
      const conversationData = {
        sessionId: 'test-session',
        startTime: new Date(),
        status: 'active' as const,
        language: {
          primary: 'en' as const,
          secondary: 'es' as const
        },
        utteranceCount: 0,
        actionCount: 0
      };
      
      // Act
      const result = await repository.create(conversationData);
      
      // Assert
      expect(result._id).toBeDefined();
      expect(result.sessionId).toBe('test-session');
      expect(result.status).toBe('active');
    });
    
    it('should throw validation error for invalid data', async () => {
      // Arrange
      const invalidData = {
        sessionId: '', // Invalid: empty string
        startTime: new Date(),
        status: 'invalid-status', // Invalid status
        language: {
          primary: 'en',
          secondary: 'es'
        }
      };
      
      // Act & Assert
      await expect(repository.create(invalidData as any)).rejects.toThrow();
    });
  });
  
  describe('findActive', () => {
    it('should return only active conversations', async () => {
      // Arrange
      await repository.create({
        sessionId: 'active-1',
        startTime: new Date(),
        status: 'active',
        language: { primary: 'en', secondary: 'es' },
        utteranceCount: 0,
        actionCount: 0
      });
      
      await repository.create({
        sessionId: 'completed-1',
        startTime: new Date(),
        status: 'completed' as any, // This should fail validation
        language: { primary: 'en', secondary: 'es' },
        utteranceCount: 0,
        actionCount: 0
      });
      
      // Act
      const activeConversations = await repository.findActive();
      
      // Assert
      expect(activeConversations).toHaveLength(1);
      expect(activeConversations[0].sessionId).toBe('active-1');
    });
  });
});
```

### Integration Test Pattern
```typescript
// __tests__/api/conversations.test.ts
describe('/api/conversations', () => {
  it('should create conversation', async () => {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session',
        languages: { primary: 'en', secondary: 'es' }
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
  });
});
```