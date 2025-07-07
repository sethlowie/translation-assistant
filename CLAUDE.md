# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Start for AI Development

**IMPORTANT**: This project uses a structured documentation system for AI-assisted development.

### 📁 AI Documentation Structure
All AI-specific documentation is in the `.ai/` directory:

```
.ai/
├── index.md              # Start here! Navigation guide
├── context.md            # Project overview & current state
├── conventions.md        # Coding standards & patterns
├── phases/
│   └── current-phase.md  # ALWAYS CHECK THIS FIRST
├── architecture/         # Technical design docs
├── examples/            # Code patterns & API examples
└── prompts/            # Tested AI prompts
```

### 🎯 Development Workflow

1. **Start Here**: Read [`.ai/index.md`](./.ai/index.md) for navigation
2. **Current Work**: Check [`.ai/phases/current-phase.md`](./.ai/phases/current-phase.md)
3. **Before Coding**: Review [`.ai/conventions.md`](./.ai/conventions.md)
4. **For Examples**: See [`.ai/examples/`](./.ai/examples/)

## Development Commands

```bash
# Install dependencies (using pnpm)
pnpm install

# Run development server
pnpm dev

# IMPORTANT: Always run before committing
pnpm check    # TypeScript & linting checks

# Build for production
pnpm build

# Start production server
pnpm start
```

## Project Overview

**Medical Language Interpreter** - Real-time English-Spanish interpretation for medical visits with:
- WebRTC voice communication via OpenAI Realtime API
- Medical terminology preservation
- Action detection (prescriptions, lab orders, etc.)
- Clinical summary generation

## Current Implementation Phase

**Phase 1: MVP Voice Chat** (see `.ai/phases/current-phase.md`)
- [ ] Basic WebRTC connection
- [ ] Voice input/output
- [ ] Simple conversation flow
- [ ] Connection management

## Key Technical Decisions

1. **WebRTC over WebSockets**: Lower latency for voice
2. **MongoDB**: Flexible schema for medical data
3. **Server-side tokens**: Security for OpenAI API
4. **Repository pattern**: Clean data access layer
5. **TypeScript strict mode**: Type safety enforced

## Environment Variables

Required in `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/medical-interpreter
OPENAI_API_KEY=sk-...
```

## Known Issues & Solutions

See [`.ai/context.md`](./.ai/context.md) for current challenges and decisions.

## TypeScript Configuration

Strict mode is enabled. Key settings:
- `strict: true`
- Path aliases: `@/*` maps to `./src/*`
- Next.js optimizations enabled

## Need More Details?

- **Architecture**: See `.ai/architecture/`
- **Current Goals**: See `.ai/phases/current-phase.md`
- **Code Examples**: See `.ai/examples/`
- **API Design**: See `.ai/architecture/api-design.md`

