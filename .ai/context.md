# Project Context - Medical Language Interpreter

## 🎯 What We're Building

A web-based medical language interpreter for real-time English-Spanish translation during in-person medical visits. The system uses voice input/output with advanced medical terminology preservation and action detection.

## 🏥 Why This Matters

- **Reduces medical errors** from miscommunication
- **Improves healthcare access** for 41M Spanish speakers in the US
- **Saves time and cost** vs scheduling human interpreters
- **Captures medical actions** for follow-up care

## 📊 Current Status

**Phase**: MVP Voice Chat (Phase 1 of 3)
**Started**: Project initialized with Next.js 15, TypeScript, MongoDB
**Next Goal**: Basic WebRTC voice conversation with OpenAI

### Completed ✅
- Next.js project setup with TypeScript
- MongoDB integration with repository pattern
- Environment configuration with validation
- Basic project structure

### In Progress 🔄
- WebRTC client implementation
- Ephemeral token endpoint
- Basic voice chat UI

### Not Started 📋
- Translation features
- Medical action detection
- Conversation storage
- Clinical summaries

## 🎪 Key Features (Full Vision)

1. **Real-time Voice Translation**
   - English ↔ Spanish interpretation
   - Sub-second latency
   - Medical terminology preservation

2. **Smart Features**
   - "Repeat that" command
   - Speaker identification
   - Confidence scoring

3. **Medical Intelligence**
   - Detect prescriptions, lab orders, referrals
   - Generate clinical summaries
   - Webhook integration for actions

4. **Professional Tools**
   - Conversation history
   - Export clinical notes
   - HIPAA-compliant storage

## 🚧 Known Issues & Decisions

### Current Challenges
- WebRTC connection stability with React StrictMode
- Need to implement proper error recovery
- Audio permissions handling across browsers

### Key Decisions Made
- **WebRTC over WebSockets**: Lower latency for voice
- **MongoDB**: Flexible schema for medical data
- **Server-side tokens**: Security for OpenAI API
- **Repository pattern**: Clean data access layer

## 📈 Success Metrics

### MVP (Current Phase)
- ✓ Stable 5-minute voice conversations
- ✓ Clear audio in both directions  
- ✓ Graceful error handling
- ✓ Sub-2s connection time

### Full Product
- Voice-to-voice latency < 1 second
- Medical term accuracy > 98%
- Action detection precision > 95%
- Support 30+ minute conversations

## 🔧 Technical Environment

- **Frontend**: Next.js 15, TypeScript, React 18
- **Styling**: Tailwind CSS
- **State**: Redux Toolkit (planned)
- **Backend**: Next.js API routes
- **Database**: MongoDB with Prisma
- **AI/Voice**: OpenAI Realtime API (WebRTC)
- **Deployment**: Vercel/GCP (planned)

## 🎨 Development Philosophy

1. **Iterative**: Build MVP first, then enhance
2. **Type-safe**: TypeScript strict mode always
3. **User-focused**: Clinician & patient experience first
4. **Reliable**: Extensive error handling
5. **Maintainable**: Clear patterns & documentation