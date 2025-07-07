# API Response Examples

## 🎯 Standard Response Formats

### Success Response Structure
```typescript
{
  success: true,
  data: T,           // Type varies by endpoint
  meta?: {           // Optional metadata
    page?: number,
    limit?: number,
    total?: number,
    hasMore?: boolean
  }
}
```

### Error Response Structure
```typescript
{
  success: false,
  error: {
    message: string,    // Human-readable
    code: string,       // Machine-readable
    details?: any       // Additional context
  }
}
```

## 📡 Session Management

### POST /api/session
**Create ephemeral token for WebRTC**

#### Success Response
```json
{
  "success": true,
  "data": {
    "token": "eph_abc123xyz789...",
    "sessionId": "sess_def456...",
    "expiresAt": "2024-01-15T10:30:00.000Z",
    "config": {
      "model": "gpt-4o-realtime-preview-2024-12-17",
      "voice": "verse",
      "instructions": "You are a medical interpreter...",
      "temperature": 0.7,
      "input_audio_format": "pcm16",
      "output_audio_format": "pcm16",
      "turn_detection": {
        "type": "server_vad",
        "threshold": 0.5,
        "silence_duration_ms": 500
      }
    }
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Failed to create session",
    "code": "OPENAI_ERROR",
    "details": {
      "status": 503,
      "provider": "openai"
    }
  }
}
```

## 💬 Conversation Management

### POST /api/conversations
**Start new conversation**

#### Request
```json
{
  "sessionId": "sess_def456...",
  "metadata": {
    "patientId": "patient_123",
    "visitType": "routine",
    "department": "cardiology"
  },
  "language": {
    "primary": "en",
    "secondary": "es"
  }
}
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "conv_789abc...",
    "sessionId": "sess_def456...",
    "startTime": "2024-01-15T10:00:00.000Z",
    "status": "active",
    "language": {
      "primary": "en",
      "secondary": "es"
    }
  }
}
```

### GET /api/conversations/:id
**Get conversation details**

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "conv_789abc...",
    "sessionId": "sess_def456...",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T10:15:00.000Z",
    "duration": 900,
    "status": "completed",
    "language": {
      "primary": "en",
      "secondary": "es"
    },
    "metadata": {
      "patientId": "patient_123",
      "visitType": "routine",
      "department": "cardiology"
    },
    "stats": {
      "utteranceCount": 42,
      "actionCount": 5,
      "medicalTermsCount": 18
    }
  }
}
```

### POST /api/conversations/:id/end
**End conversation**

#### Request
```json
{
  "generateSummary": true,
  "finalTranscript": "Optional client-side transcript..."
}
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "conv_789abc...",
    "endTime": "2024-01-15T10:15:00.000Z",
    "duration": 900,
    "utteranceCount": 42,
    "actionCount": 5,
    "summary": {
      "id": "summary_xyz123...",
      "content": {
        "chiefComplaint": "Patient presents with chest pain...",
        "historyOfPresentIllness": "Started 3 days ago...",
        "assessmentAndPlan": "Likely GERD, prescribe omeprazole...",
        "medicationsDiscussed": ["omeprazole 20mg", "aspirin 81mg"],
        "testsOrdered": ["ECG", "Troponin levels"],
        "followUpInstructions": "Return in 2 weeks or if symptoms worsen"
      }
    }
  }
}
```

## 🗣️ Utterances

### POST /api/utterances
**Add utterance to conversation**

#### Request
```json
{
  "conversationId": "conv_789abc...",
  "role": "clinician",
  "originalLanguage": "en",
  "originalText": "How long have you had this pain?",
  "translatedText": "¿Cuánto tiempo ha tenido este dolor?",
  "confidence": {
    "transcription": 0.95,
    "translation": 0.92
  },
  "medicalTerms": [
    {
      "term": "pain",
      "category": "symptom",
      "confidence": 0.98
    }
  ],
  "timestamp": "2024-01-15T10:05:00.000Z"
}
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "utt_abc123...",
    "conversationId": "conv_789abc...",
    "sequenceNumber": 7,
    "role": "clinician",
    "originalLanguage": "en",
    "originalText": "How long have you had this pain?",
    "translatedText": "¿Cuánto tiempo ha tenido este dolor?",
    "timestamp": "2024-01-15T10:05:00.000Z"
  }
}
```

## 🎯 Action Detection

### POST /api/actions/detect
**Detect medical actions in text**

#### Request
```json
{
  "conversationId": "conv_789abc...",
  "text": "I'll prescribe amoxicillin 500mg twice daily for 7 days and order a chest X-ray",
  "utteranceId": "utt_def456...",
  "context": {
    "previousActions": [],
    "patientHistory": {
      "allergies": ["penicillin"]
    }
  }
}
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": "action_111...",
        "type": "prescription",
        "confidence": 0.95,
        "details": {
          "medication": {
            "name": "amoxicillin",
            "dosage": "500mg",
            "frequency": "twice daily",
            "duration": "7 days",
            "rxnormCode": "723"
          }
        },
        "warnings": ["Patient has penicillin allergy"],
        "suggestedWebhook": "https://webhook.site/medication-order"
      },
      {
        "id": "action_222...",
        "type": "diagnostic_test",
        "confidence": 0.98,
        "details": {
          "test": {
            "name": "chest X-ray",
            "category": "radiology",
            "cptCode": "71020"
          }
        },
        "suggestedWebhook": "https://webhook.site/radiology-order"
      }
    ],
    "stats": {
      "totalDetected": 2,
      "byType": {
        "prescription": 1,
        "diagnostic_test": 1
      }
    }
  }
}
```

### GET /api/actions/:id
**Get action details**

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "action_111...",
    "conversationId": "conv_789abc...",
    "utteranceId": "utt_def456...",
    "type": "prescription",
    "category": "routine",
    "details": {
      "medication": {
        "name": "amoxicillin",
        "dosage": "500mg",
        "frequency": "twice daily",
        "duration": "7 days",
        "rxnormCode": "723"
      }
    },
    "confidence": 0.95,
    "validated": true,
    "validatedBy": "clinician_123",
    "validatedAt": "2024-01-15T10:10:00.000Z",
    "webhook": {
      "url": "https://webhook.site/medication-order",
      "status": "sent",
      "attempts": 1,
      "lastAttempt": "2024-01-15T10:11:00.000Z",
      "response": {
        "orderId": "rx_789",
        "status": "queued"
      }
    },
    "detectedAt": "2024-01-15T10:08:00.000Z",
    "executedAt": "2024-01-15T10:11:00.000Z"
  }
}
```

## 📄 Summaries

### POST /api/summaries/generate
**Generate clinical summary**

#### Request
```json
{
  "conversationId": "conv_789abc...",
  "format": "clinical_note",
  "includeSections": [
    "chief_complaint",
    "hpi",
    "assessment_plan",
    "medications",
    "follow_up"
  ]
}
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "summary_999...",
    "conversationId": "conv_789abc...",
    "content": {
      "chiefComplaint": "Chest pain for 3 days",
      "historyOfPresentIllness": "53-year-old male presents with intermittent chest pain...",
      "assessmentAndPlan": "1. GERD - Start PPI therapy\n2. Rule out cardiac causes...",
      "medicationsDiscussed": [
        "Omeprazole 20mg daily",
        "Aspirin 81mg daily"
      ],
      "testsOrdered": [
        "ECG",
        "Troponin levels",
        "Lipid panel"
      ],
      "followUpInstructions": "Return in 2 weeks for follow-up"
    },
    "extractedData": {
      "symptoms": [
        {
          "name": "chest pain",
          "duration": "3 days",
          "severity": "moderate",
          "characteristics": ["burning", "worse after meals"]
        }
      ],
      "vitalSigns": {
        "bloodPressure": "130/80",
        "heartRate": "78",
        "temperature": "98.6F"
      },
      "diagnoses": [
        {
          "description": "Gastroesophageal reflux disease",
          "icd10Code": "K21.0",
          "confidence": 0.85
        }
      ]
    },
    "generatedBy": "automatic",
    "model": "gpt-4",
    "reviewStatus": "pending",
    "generatedAt": "2024-01-15T10:16:00.000Z"
  }
}
```

## 🔧 System Health

### GET /api/health
**System health check**

#### Success Response (Healthy)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "checks": {
    "api": "healthy",
    "database": "healthy",
    "openai": "healthy",
    "webhooks": "healthy"
  },
  "version": "1.0.0",
  "uptime": 86400
}
```

#### Response (Degraded)
```json
{
  "status": "degraded",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "checks": {
    "api": "healthy",
    "database": "healthy",
    "openai": "healthy",
    "webhooks": "unhealthy"
  },
  "errors": {
    "webhooks": "Connection timeout to webhook service"
  }
}
```

## 🚫 Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Invalid request parameters",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "sessionId",
        "message": "Session ID is required"
      }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Conversation not found",
    "code": "NOT_FOUND"
  }
}
```

### 429 Rate Limited
```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded",
    "code": "RATE_LIMITED",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retryAfter": 45
    }
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR",
    "details": {
      "requestId": "req_abc123..."
    }
  }
}
```

## 🔄 Webhook Payloads

### Action Detected Webhook
```json
{
  "event": "medical.action.detected",
  "timestamp": "2024-01-15T10:08:00.000Z",
  "action": {
    "id": "action_111...",
    "type": "prescription",
    "details": {
      "medication": {
        "name": "amoxicillin",
        "dosage": "500mg",
        "frequency": "twice daily",
        "duration": "7 days"
      }
    },
    "confidence": 0.95
  },
  "conversation": {
    "id": "conv_789abc...",
    "metadata": {
      "patientId": "patient_123",
      "visitType": "routine"
    }
  },
  "signature": "sha256=abc123..."
}
```

### Conversation Ended Webhook
```json
{
  "event": "conversation.ended",
  "timestamp": "2024-01-15T10:15:00.000Z",
  "conversation": {
    "id": "conv_789abc...",
    "duration": 900,
    "utteranceCount": 42,
    "actionCount": 5
  },
  "summary": {
    "available": true,
    "url": "https://api.example.com/summaries/summary_999"
  },
  "signature": "sha256=def456..."
}
```