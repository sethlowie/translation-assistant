# Technology Stack & Rationale

## 🎯 Stack Overview

| Layer | Technology | Why Chosen |
|-------|-----------|------------|
| **Frontend Framework** | Next.js 15 | App Router, RSC, TypeScript support |
| **UI Library** | React 18 | Industry standard, great ecosystem |
| **Language** | TypeScript | Type safety, better DX, fewer bugs |
| **Styling** | Tailwind CSS | Rapid development, consistent design |
| **State Management** | Redux Toolkit | Complex state, DevTools, predictable |
| **Real-time Comms** | WebRTC | Lowest latency for voice |
| **AI/Voice** | OpenAI Realtime API | Best-in-class voice AI |
| **Database** | MongoDB | Flexible schema, good for transcripts |
| **Deployment** | Vercel/GCP | Easy scaling, global CDN |

## 🏗️ Detailed Technology Decisions

### Frontend Stack

#### Next.js 15 (App Router)
**Why chosen:**
- Server Components for better performance
- Built-in API routes eliminate separate backend
- Excellent TypeScript support
- Streaming SSR for faster initial load
- Built-in optimizations (image, font, script)

**Alternatives considered:**
- ❌ Create React App - No SSR, requires separate backend
- ❌ Remix - Less mature ecosystem
- ❌ Vanilla React - Too much setup required

#### TypeScript
**Why chosen:**
- Catches errors at compile time
- Better IDE support and autocomplete
- Self-documenting code
- Easier refactoring
- Required for enterprise applications

**Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### Tailwind CSS
**Why chosen:**
- Rapid prototyping
- Consistent spacing/colors
- No CSS-in-JS runtime overhead
- Great documentation
- Works well with component libraries

**Alternatives considered:**
- ❌ CSS Modules - More boilerplate
- ❌ Styled Components - Runtime overhead
- ❌ Emotion - Similar to styled-components

### State Management

#### Redux Toolkit
**Why chosen:**
- Predictable state updates
- Excellent DevTools
- Time-travel debugging
- Good for complex state (transcripts, WebRTC)
- RTK Query for API caching

**Use cases in this app:**
```typescript
// Conversation state
interface ConversationState {
  status: 'idle' | 'connecting' | 'active' | 'ending';
  transcript: Utterance[];
  detectedActions: Action[];
  connectionQuality: ConnectionMetrics;
}
```

**Alternatives considered:**
- ❌ Zustand - Less mature DevTools
- ❌ Context API - Not suitable for frequent updates
- ❌ MobX - More complex mental model

### Real-time Communication

#### WebRTC (via OpenAI)
**Why chosen:**
- P2P connection = lowest latency
- Built-in echo cancellation
- Adaptive bitrate
- NAT traversal handled
- Browser native support

**Architecture benefits:**
```
Traditional: Browser → Server → OpenAI → Server → Browser
WebRTC:     Browser ←──────────────────→ OpenAI
```

**Alternatives considered:**
- ❌ WebSockets - Higher latency, no built-in audio
- ❌ Server-Sent Events - One-way only
- ❌ Long polling - Too much overhead

### AI & Voice Processing

#### OpenAI Realtime API
**Why chosen:**
- State-of-art speech recognition (Whisper)
- Excellent language models (GPT-4)
- Native Spanish support
- Built-in VAD (Voice Activity Detection)
- Function calling for actions

**Key features utilized:**
- Real-time streaming transcription
- Multi-language support
- Custom instructions
- Turn detection
- Function calling for medical actions

### Database

#### MongoDB (Native Driver + Zod)
**Why chosen:**
- Flexible schema for evolving requirements
- Excellent for storing conversation transcripts
- Good performance for time-series data
- Easy local development
- Atlas for managed hosting

**Architecture decisions:**
- **No ORM**: Direct MongoDB driver for full control and performance
- **Zod validation**: Type-safe data validation at application boundary
- **Repository pattern**: Clean separation of data access
- **Service layer**: Business logic isolated from database
- **Dependency injection**: Easy testing and future flexibility

**Data patterns that benefit:**
```javascript
// Flexible medical terms storage
{
  medicalTerms: [
    { term: "hypertension", confidence: 0.95, icd10: ["I10"] },
    { term: "diabetes", confidence: 0.88, icd10: ["E11.9"] }
  ]
}

// Nested conversation structure with validation
const schema = z.object({
  conversation: z.object({
    utterances: z.array(utteranceSchema),
    actions: z.array(actionSchema),
    metadata: metadataSchema
  })
});
```

**Alternatives considered:**
- ❌ PostgreSQL - More rigid schema, requires migrations
- ❌ DynamoDB - Vendor lock-in, limited querying
- ❌ Firebase - Limited querying capabilities
- ❌ Prisma/TypeORM - Unnecessary abstraction, less control

### Backend Infrastructure

#### Next.js API Routes
**Why chosen:**
- Same codebase as frontend
- Automatic TypeScript sharing
- Serverless by default
- Easy deployment
- Built-in middleware support

**Pattern example:**
```typescript
// app/api/conversations/route.ts
export async function POST(request: Request) {
  // Automatic serverless function
}
```

#### Environment Management
**Why chosen: @t3-oss/env-nextjs**
- Runtime validation
- Type-safe environment variables
- Clear error messages
- Prevents deployment with missing vars

### Development Tools

#### Package Manager: pnpm
**Why chosen:**
- Faster than npm/yarn
- Smaller node_modules
- Strict dependency resolution
- Better monorepo support

#### Code Quality Tools
- **ESLint**: Catch code issues
- **Prettier**: Consistent formatting
- **Husky**: Git hooks for quality
- **lint-staged**: Only lint changed files

### Deployment & Hosting

#### Vercel (Recommended)
**Why chosen:**
- Zero-config Next.js deployment
- Automatic preview deployments
- Global CDN
- Serverless functions included
- Great DX

#### Alternative: Google Cloud Platform
**Why considered:**
- More control over infrastructure
- Better for HIPAA compliance
- Can run anywhere (Cloud Run)
- Good MongoDB Atlas integration

### Future Considerations

#### Scaling Technologies
```yaml
When we need to scale:
  Caching: Redis
  Queue: BullMQ
  Search: Elasticsearch
  Analytics: Mixpanel/Amplitude
  Monitoring: Sentry + Datadog
  CDN: Cloudflare
```

#### Security Stack (Future)
```yaml
Authentication: Auth0/Clerk
Authorization: Permit.io/OSO
Secrets: Hashicorp Vault
WAF: Cloudflare
```

## 📊 Technology Decision Matrix

| Requirement | Technology Choice | Score (1-10) |
|-------------|------------------|--------------|
| **Low Latency Voice** | WebRTC | 10 |
| **Type Safety** | TypeScript | 9 |
| **Developer Experience** | Next.js + Vercel | 9 |
| **Flexibility** | MongoDB | 8 |
| **State Management** | Redux Toolkit | 8 |
| **Styling Speed** | Tailwind CSS | 9 |
| **AI Capabilities** | OpenAI API | 10 |
| **Deployment Ease** | Vercel | 10 |

## 🚀 Getting Started Commands

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add: OPENAI_API_KEY, MONGODB_URI

# Run development
pnpm dev

# Type checking
pnpm check

# Build for production
pnpm build

# Deploy
vercel
```

## 📚 Learning Resources

### For the stack:
- [Next.js 15 Docs](https://nextjs.org/docs)
- [OpenAI Realtime Guide](https://platform.openai.com/docs/guides/realtime)
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [MongoDB University](https://university.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Medical domain:
- [ICD-10 Codes](https://www.icd10data.com/)
- [RxNorm API](https://rxnav.nlm.nih.gov/)
- [HIPAA Guidelines](https://www.hhs.gov/hipaa/)