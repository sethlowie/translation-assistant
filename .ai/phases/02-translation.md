# Phase 2: Add Translation Features

## 🎯 Goal

Enhance the voice chat to support real-time English-Spanish translation for medical conversations.

## ✅ Prerequisites (From Phase 1)

- [ ] Working WebRTC voice connection
- [ ] Stable audio in both directions
- [ ] Clean connection/disconnection flow
- [ ] Basic error handling

## 🎪 What We're Building

Enhance the existing voice chat with:

1. Language selection (English/Spanish)
2. Real-time translation during conversation
3. Display of original and translated text
4. "Repeat that" functionality
5. Basic transcript storage

**NOT in this phase:**

- Medical terminology detection
- Action detection
- Clinical summaries
- Just focus on accurate translation

## 📋 Implementation Checklist

### 1. Update OpenAI Session Configuration

- [ ] Modify `/api/session/route.ts` to accept language config
- [ ] Update instructions for translation mode
- [ ] Configure proper voice for each language

### 2. Enhance WebRTC Client

- [ ] Add session update capability
- [ ] Handle transcription events
- [ ] Implement "repeat that" command
- [ ] Track conversation utterances

### 3. State Management

- [ ] Set up Redux store
- [ ] Create conversation slice
- [ ] Add utterance management
- [ ] Handle language switching

### 4. UI Enhancements

- [ ] Add language toggle component
- [ ] Create transcript display
- [ ] Show original + translated text
- [ ] Add "Repeat" button
- [ ] Visual indicators for active speaker

### 5. Data Persistence

- [ ] Create conversation in DB on start
- [ ] Store utterances as they occur
- [ ] Update conversation on end
- [ ] Add basic retrieval API

## 🚦 Success Criteria

1. **Translation Quality**: Accurate general conversation translation
2. **Latency**: Translation adds < 500ms delay
3. **UI Clarity**: Clear indication of original vs translated
4. **Language Switch**: Can change languages mid-conversation
5. **Repeat Function**: Successfully replays last utterance
6. **Data Storage**: All utterances saved to database

## 💻 Code Examples

### Enhanced Session API

```typescript
// /api/session/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const { primaryLanguage = "en", secondaryLanguage = "es" } = body;

  const instructions = `
    You are a medical interpreter. Your job is to facilitate communication between 
    an ${primaryLanguage === "en" ? "English" : "Spanish"}-speaking healthcare provider 
    and a ${secondaryLanguage === "es" ? "Spanish" : "English"}-speaking patient.
    
    For each utterance:
    1. Identify the speaker (doctor or patient)
    2. Translate accurately to the other language
    3. Preserve medical terms precisely
    4. Speak the translation clearly
    
    If someone says "repeat that" or "can you say that again", repeat the last translation.
  `;

  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: primaryLanguage === "es" ? "nova" : "verse",
      instructions,
      input_audio_transcription: {
        model: "whisper-1",
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
    }),
  });

  // ... rest of implementation
}
```

### Redux Store Setup

```typescript
// lib/client/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import conversationReducer from "./conversationSlice";

export const store = configureStore({
  reducer: {
    conversation: conversationReducer,
  },
});

// lib/client/store/conversationSlice.ts
interface ConversationState {
  id: string | null;
  status: "idle" | "active" | "ended";
  languages: {
    primary: "en" | "es";
    secondary: "en" | "es";
  };
  utterances: Array<{
    id: string;
    role: "clinician" | "patient";
    originalText: string;
    translatedText?: string;
    timestamp: string;
    language: "en" | "es";
  }>;
}

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    addUtterance: (state, action) => {
      state.utterances.push(action.payload);
    },
    switchLanguages: (state) => {
      const temp = state.languages.primary;
      state.languages.primary = state.languages.secondary;
      state.languages.secondary = temp;
    },
  },
});
```

### Enhanced WebRTC Client

```typescript
export class RealtimeClient {
  // ... existing code ...

  setupDataChannel() {
    this.dc = this.pc.createDataChannel("oai-events");

    this.dc.onmessage = (event) => {
      const realtimeEvent = JSON.parse(event.data);
      this.handleRealtimeEvent(realtimeEvent);
    };
  }

  handleRealtimeEvent(event: any) {
    switch (event.type) {
      case "conversation.item.created":
        if (event.item.role === "user" && event.item.content?.[0]?.transcript) {
          // User spoke - original language
          this.onUtterance?.({
            role: "clinician", // or detect from voice
            originalText: event.item.content[0].transcript,
            language: this.languages.primary,
            timestamp: new Date().toISOString(),
          });
        } else if (
          event.item.role === "assistant" &&
          event.item.content?.[0]?.transcript
        ) {
          // Assistant spoke - translation
          this.onTranslation?.({
            translatedText: event.item.content[0].transcript,
            language: this.languages.secondary,
          });
        }
        break;

      case "input_audio_buffer.speech_started":
        this.onSpeechStart?.();
        break;

      case "input_audio_buffer.speech_stopped":
        this.onSpeechEnd?.();
        break;
    }
  }

  repeatLast() {
    this.sendEvent({
      type: "response.create",
      response: {
        modalities: ["text", "audio"],
        instructions: "Repeat the last translation you provided.",
      },
    });
  }
}
```

### Transcript Display Component

```typescript
// components/TranscriptDisplay/index.tsx
export function TranscriptDisplay() {
  const utterances = useSelector((state: RootState) => state.conversation.utterances);

  return (
    <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
      {utterances.map((utterance) => (
        <div key={utterance.id} className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">
              {utterance.role === 'clinician' ? '👨‍⚕️ Doctor' : '🧑 Patient'}
            </span>
            <span>{utterance.language.toUpperCase()}</span>
            <span>{new Date(utterance.timestamp).toLocaleTimeString()}</span>
          </div>

          <div className="pl-8">
            <p className="text-gray-900">{utterance.originalText}</p>
            {utterance.translatedText && (
              <p className="text-blue-600 italic mt-1">
                → {utterance.translatedText}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Language Toggle Component

```typescript
// components/LanguageToggle/index.tsx
export function LanguageToggle() {
  const dispatch = useDispatch();
  const { primary, secondary } = useSelector(
    (state: RootState) => state.conversation.languages
  );

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="font-medium">Doctor:</span>
        <span className="text-lg">{primary === 'en' ? '🇺🇸 English' : '🇪🇸 Español'}</span>
      </div>

      <button
        onClick={() => dispatch(switchLanguages())}
        className="p-2 bg-blue-500 text-white rounded-full"
        title="Switch languages"
      >
        ⇄
      </button>

      <div className="flex items-center gap-2">
        <span className="font-medium">Patient:</span>
        <span className="text-lg">{secondary === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}</span>
      </div>
    </div>
  );
}
```

## 🗄️ Database Updates

### Start Conversation API

```typescript
// /api/conversations/route.ts
export async function POST(request: Request) {
  const { sessionId, languages } = await request.json();

  const conversation = await conversationRepo.create({
    sessionId,
    status: "active",
    startTime: new Date(),
    language: languages,
    utteranceCount: 0,
    actionCount: 0,
  });

  return NextResponse.json({
    success: true,
    data: { id: conversation._id.toString() },
  });
}
```

### Store Utterance API

```typescript
// /api/utterances/route.ts
export async function POST(request: Request) {
  const utterance = await request.json();

  const saved = await utteranceRepo.create({
    ...utterance,
    conversationId: new ObjectId(utterance.conversationId),
    timestamp: new Date(utterance.timestamp),
  });

  // Update conversation utterance count
  await conversationRepo.update(utterance.conversationId, {
    $inc: { utteranceCount: 1 },
  });

  return NextResponse.json({ success: true, data: saved });
}
```

## 🧪 Testing Scenarios

1. **Basic Translation Flow**

   - Doctor speaks in English
   - Patient hears in Spanish
   - Patient responds in Spanish
   - Doctor hears in English

2. **Language Switching**

   - Start with EN→ES
   - Switch mid-conversation to ES→EN
   - Verify correct translation direction

3. **Repeat Functionality**

   - Have a conversation
   - Click "Repeat" button
   - Verify last translation is repeated

4. **Transcript Accuracy**
   - Compare displayed text with audio
   - Verify both languages shown
   - Check timestamp accuracy

## 🐛 Common Issues & Solutions

| Issue                       | Solution                         |
| --------------------------- | -------------------------------- |
| Wrong translation direction | Check language config in session |
| Transcript not updating     | Verify Redux connection          |
| "Repeat" not working        | Check event handling in client   |
| Missing utterances in DB    | Ensure API calls are made        |

## 📚 Key Concepts

### Translation Instructions

The key to good translation is clear instructions to the AI:

- Specify source and target languages
- Clarify speaker roles
- Request preservation of medical terms
- Handle "repeat" commands explicitly

### Speaker Identification

Currently using simple heuristics:

- Could enhance with voice characteristics
- Or add explicit role selection UI
- Important for correct translation direction

## ➡️ Next Phase

Once translation is working smoothly, proceed to [Phase 3: Medical Features](./03-medical.md)

