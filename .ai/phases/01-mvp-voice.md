# Phase 1: MVP Voice Chat

## 🎯 Goal

Build a basic voice conversation system between a user and OpenAI's voice AI using WebRTC.

## ✅ Prerequisites Completed

- [ ] Next.js 15 project initialized
- [ ] TypeScript configured with strict mode
- [ ] MongoDB connection established
- [ ] Environment variables setup
- [ ] Basic folder structure created

## 🎪 What We're Building

A simple voice chat interface that:

1. User clicks "Start Conversation"
2. Grants microphone permission
3. Connects to OpenAI via WebRTC
4. Can speak and hear AI responses
5. Shows connection status
6. Can end conversation cleanly

**NOT in this phase:**

- No translation features
- No medical terminology
- No action detection
- No conversation storage
- Just plain English conversation

## 📋 Implementation Checklist

### 1. Backend - Ephemeral Token Endpoint

- [ ] Create `/api/session/route.ts`
- [ ] Implement OpenAI session creation
- [ ] Return ephemeral token to client
- [ ] Add error handling

### 2. Frontend - WebRTC Client

- [ ] Create `lib/client/webrtc/RealtimeClient.ts`
- [ ] Implement connection flow:
  - [ ] Get ephemeral token
  - [ ] Create RTCPeerConnection
  - [ ] Set up audio streams
  - [ ] Create data channel
  - [ ] Exchange SDP with OpenAI
- [ ] Handle connection states
- [ ] Implement cleanup on disconnect

### 3. UI Components

- [ ] Create `components/VoiceChat/index.tsx`
- [ ] Add Start/Stop buttons
- [ ] Show connection status
- [ ] Add audio element for playback
- [ ] Basic error display

### 4. Integration

- [ ] Wire up VoiceChat component to homepage
- [ ] Test full flow end-to-end
- [ ] Add loading states
- [ ] Handle permissions gracefully

## 🚦 Success Criteria

1. **Connection**: Establishes WebRTC connection within 2 seconds
2. **Audio Quality**: Clear audio in both directions
3. **Stability**: Maintains connection for 5+ minutes
4. **Error Handling**: Graceful handling of:
   - Microphone permission denied
   - Network disconnection
   - Token expiration
5. **Cleanup**: Properly releases resources on stop

## 💻 Code Examples

### API Route (`/api/session/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST() {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "verse",
          instructions:
            "You are a helpful, friendly assistant. Keep responses concise.",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        token: data.client_secret.value,
        sessionId: data.id,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Session creation failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create session" },
      { status: 500 },
    );
  }
}
```

### Basic WebRTC Client Structure

```typescript
export class RealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;

  async connect(): Promise<void> {
    // 1. Get token
    const tokenResponse = await fetch("/api/session", { method: "POST" });
    const { data } = await tokenResponse.json();

    // 2. Create peer connection
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // 3. Set up audio
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => {
      this.pc!.addTrack(track, stream);
    });

    // 4. Create data channel
    this.dc = this.pc.createDataChannel("oai-events");

    // 5. Create offer and set local description
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // 6. Exchange SDP with OpenAI
    const sdpResponse = await fetch(
      `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
      {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${data.token}`,
          "Content-Type": "application/sdp",
        },
      },
    );

    const answerSdp = await sdpResponse.text();
    await this.pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
  }

  disconnect(): void {
    // Cleanup code
  }
}
```

### Simple UI Component

```typescript
'use client';

import { useState } from 'react';
import { RealtimeClient } from '@/lib/client/webrtc/RealtimeClient';

export function VoiceChat() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [client] = useState(() => new RealtimeClient());

  const handleStart = async () => {
    try {
      setStatus('connecting');
      await client.connect();
      setStatus('connected');
    } catch (error) {
      setStatus('error');
      console.error('Connection failed:', error);
    }
  };

  const handleStop = () => {
    client.disconnect();
    setStatus('idle');
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="text-lg font-semibold">
        Status: {status}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleStart}
          disabled={status !== 'idle'}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Start Conversation
        </button>

        <button
          onClick={handleStop}
          disabled={status !== 'connected'}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Stop
        </button>
      </div>

      <audio id="audio-output" autoPlay />
    </div>
  );
}
```

## 🧪 Testing Plan

1. **Happy Path**

   - Start conversation
   - Speak a question
   - Hear AI response
   - Have back-and-forth conversation
   - End cleanly

2. **Error Cases**

   - Deny microphone permission
   - Lose internet connection
   - Token expires during conversation
   - Close browser tab

3. **Browser Testing**
   - Chrome (primary)
   - Firefox
   - Safari
   - Edge

## 🐛 Common Issues & Solutions

| Issue                      | Solution                                     |
| -------------------------- | -------------------------------------------- |
| "Microphone not found"     | Check permissions, try different browser     |
| "Connection timeout"       | Verify OPENAI_API_KEY is set                 |
| "No audio output"          | Ensure `autoplay` attribute on audio element |
| "WebRTC connection failed" | Check browser console for ICE errors         |

## 📚 Resources

- [OpenAI Realtime Docs](https://platform.openai.com/docs/guides/realtime)
- [MDN WebRTC Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC Samples](https://webrtc.github.io/samples/)

## ➡️ Next Phase

Once all success criteria are met, proceed to [Phase 2: Translation](./02-translation.md)

