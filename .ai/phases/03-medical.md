# Phase 3: Medical-Specific Features

## 🎯 Goal

Transform the translation system into a medical-grade interpreter with action detection and clinical documentation.

## ✅ Prerequisites (From Phase 2)

- [ ] Working English-Spanish translation
- [ ] Transcript display with both languages
- [ ] Conversation storage in database
- [ ] "Repeat that" functionality
- [ ] Stable WebRTC connection

## 🎪 What We're Building

Medical-specific enhancements:

1. Medical terminology preservation
2. Action detection (prescriptions, lab orders, etc.)
3. Webhook execution for detected actions
4. Clinical summary generation
5. Export capabilities for medical records

## 📋 Implementation Checklist

### 1. Medical Terminology System

- [ ] Create medical terms dictionary
- [ ] Implement term detection in utterances
- [ ] Add confidence scoring
- [ ] Preserve terms during translation
- [ ] Link to medical codes (ICD-10, RxNorm)

### 2. Action Detection Engine

- [ ] Create action detection service
- [ ] Implement detection for:
  - [ ] Prescriptions
  - [ ] Lab orders
  - [ ] Referrals
  - [ ] Follow-up appointments
  - [ ] Diagnostic tests
- [ ] Add confidence thresholds
- [ ] Store detected actions

### 3. Webhook Integration

- [ ] Create webhook execution service
- [ ] Implement retry logic
- [ ] Add webhook status tracking
- [ ] Create test endpoint
- [ ] Handle webhook responses

### 4. Clinical Summary Generation

- [ ] Create summary generation endpoint
- [ ] Implement structured summary format
- [ ] Extract key medical data
- [ ] Generate at conversation end
- [ ] Allow manual regeneration

### 5. UI Enhancements

- [ ] Add action detection panel
- [ ] Create summary view
- [ ] Add export functionality
- [ ] Show confidence indicators
- [ ] Add validation UI for actions

## 🚦 Success Criteria

1. **Medical Accuracy**: 98%+ accuracy on medical terms
2. **Action Detection**: 95%+ precision on common actions
3. **Webhook Reliability**: 99%+ delivery rate with retries
4. **Summary Quality**: Clinically useful summaries
5. **Export Format**: Compatible with EHR systems

## 💻 Code Examples

### Medical Terminology Detection

```typescript
// lib/server/medical/terminology.ts
interface MedicalTerm {
  term: string;
  category: "medication" | "procedure" | "condition" | "anatomy" | "lab";
  synonyms: string[];
  codes?: {
    icd10?: string[];
    rxnorm?: string;
    loinc?: string;
    cpt?: string[];
  };
}

export class MedicalTermDetector {
  private terms: Map<string, MedicalTerm>;

  constructor() {
    this.loadMedicalDictionary();
  }

  async detectTerms(text: string): Promise<Array<DetectedTerm>> {
    const detected: DetectedTerm[] = [];
    const normalized = text.toLowerCase();

    // Check each term in dictionary
    for (const [key, term] of this.terms) {
      const regex = new RegExp(`\\b${key}\\b`, "i");
      if (regex.test(normalized)) {
        detected.push({
          ...term,
          confidence: this.calculateConfidence(term, text),
          position: normalized.indexOf(key),
        });
      }
    }

    // Also check synonyms
    for (const [_, term] of this.terms) {
      for (const synonym of term.synonyms) {
        const regex = new RegExp(`\\b${synonym}\\b`, "i");
        if (regex.test(normalized)) {
          detected.push({
            ...term,
            matchedText: synonym,
            confidence: this.calculateConfidence(term, text) * 0.9,
            position: normalized.indexOf(synonym),
          });
        }
      }
    }

    return detected;
  }
}
```

### Action Detection Service

```typescript
// lib/server/actions/detector.ts
export class ActionDetector {
  async detectActions(
    utterance: string,
    context?: ConversationContext,
  ): Promise<Action[]> {
    const actions: Action[] = [];

    // Prescription detection
    const prescriptionPattern = /(?:prescribe|medication|take|mg|tablet|pill)/i;
    if (prescriptionPattern.test(utterance)) {
      const prescription = await this.extractPrescription(utterance);
      if (prescription) {
        actions.push({
          type: "prescription",
          details: prescription,
          confidence: prescription.confidence,
          utteranceText: utterance,
        });
      }
    }

    // Lab order detection
    const labPattern = /(?:blood test|lab|CBC|panel|glucose|cholesterol)/i;
    if (labPattern.test(utterance)) {
      const labOrder = await this.extractLabOrder(utterance);
      if (labOrder) {
        actions.push({
          type: "lab_order",
          details: labOrder,
          confidence: labOrder.confidence,
          utteranceText: utterance,
        });
      }
    }

    // Follow-up detection
    const followUpPattern =
      /(?:come back|follow up|see you|appointment|weeks?|months?)/i;
    if (followUpPattern.test(utterance)) {
      const followUp = await this.extractFollowUp(utterance);
      if (followUp) {
        actions.push({
          type: "follow_up",
          details: followUp,
          confidence: followUp.confidence,
          utteranceText: utterance,
        });
      }
    }

    return actions;
  }

  private async extractPrescription(
    text: string,
  ): Promise<PrescriptionDetails | null> {
    // Use GPT to extract structured prescription data
    const prompt = `Extract prescription information from: "${text}"
    Return JSON with: medication, dosage, frequency, duration, confidence`;

    const extraction = await this.callGPT(prompt);
    return extraction;
  }
}
```

### Webhook Execution Service

```typescript
// lib/server/webhooks/executor.ts
export class WebhookExecutor {
  private queue: Queue;

  constructor() {
    this.queue = new Queue("webhooks", {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });

    this.setupProcessor();
  }

  async executeWebhook(action: Action, url: string): Promise<void> {
    await this.queue.add("execute", {
      action,
      url,
      timestamp: new Date(),
    });
  }

  private setupProcessor() {
    this.queue.process("execute", async (job) => {
      const { action, url } = job.data;

      const payload = {
        event: "medical.action.detected",
        action: {
          id: action._id,
          type: action.type,
          details: action.details,
          confidence: action.confidence,
        },
        conversation: {
          id: action.conversationId,
        },
        timestamp: new Date().toISOString(),
      };

      const signature = this.generateSignature(payload);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      // Update action with webhook result
      await actionRepo.update(action._id, {
        "webhook.status": "sent",
        "webhook.response": await response.json(),
        "webhook.lastAttempt": new Date(),
      });
    });
  }
}
```

### Clinical Summary Generator

```typescript
// lib/server/summaries/generator.ts
export class SummaryGenerator {
  async generateSummary(conversationId: string): Promise<Summary> {
    // Get all utterances
    const utterances = await utteranceRepo.findByConversation(conversationId);
    const actions = await actionRepo.findByConversation(conversationId);

    // Create transcript
    const transcript = utterances
      .map((u) => `${u.role}: ${u.originalText}`)
      .join("\n");

    // Generate summary using GPT
    const prompt = `Generate a clinical summary from this medical conversation:

${transcript}

Detected Actions:
${actions.map((a) => `- ${a.type}: ${JSON.stringify(a.details)}`).join("\n")}

Format the summary with these sections:
1. Chief Complaint
2. History of Present Illness
3. Assessment and Plan
4. Medications Discussed
5. Tests Ordered
6. Follow-up Instructions

Also extract:
- Symptoms with duration and severity
- Any vital signs mentioned
- Potential diagnoses with ICD-10 codes`;

    const summary = await this.callGPT(prompt);

    // Store summary
    return await summaryRepo.create({
      conversationId: new ObjectId(conversationId),
      content: summary.content,
      extractedData: summary.extractedData,
      generatedBy: "automatic",
      model: "gpt-4",
      generatedAt: new Date(),
    });
  }
}
```

### Medical UI Components

```typescript
// components/ActionPanel/index.tsx
export function ActionPanel() {
  const actions = useSelector((state: RootState) => state.conversation.actions);
  const [validating, setValidating] = useState<string | null>(null);

  const handleValidate = async (actionId: string) => {
    setValidating(actionId);
    await fetch(`/api/actions/${actionId}/validate`, { method: 'POST' });
    setValidating(null);
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Detected Medical Actions</h3>

      <div className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className={`p-3 rounded-lg border ${
              action.validated ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{action.type}</span>
                  <span className="text-sm text-gray-600">
                    {(action.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>

                <div className="mt-1 text-sm">
                  {action.type === 'prescription' && (
                    <p>
                      {action.details.medication.name} - {action.details.medication.dosage}
                      {action.details.medication.frequency && `, ${action.details.medication.frequency}`}
                    </p>
                  )}
                  {action.type === 'lab_order' && (
                    <p>{action.details.labTest.name}</p>
                  )}
                  {action.type === 'follow_up' && (
                    <p>Follow-up in {action.details.followUp.timeframe}</p>
                  )}
                </div>
              </div>

              {!action.validated && (
                <button
                  onClick={() => handleValidate(action.id)}
                  disabled={validating === action.id}
                  className="ml-2 px-3 py-1 text-sm bg-blue-500 text-white rounded"
                >
                  {validating === action.id ? 'Validating...' : 'Validate'}
                </button>
              )}
            </div>

            {action.webhook?.status && (
              <div className="mt-2 text-xs text-gray-600">
                Webhook: {action.webhook.status}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testing Medical Features

### Test Conversations

```typescript
// Test prescription detection
Doctor: "I'm going to prescribe amoxicillin 500mg, take it twice daily for 10 days"
Expected: Prescription action with medication, dosage, frequency, duration

// Test lab order
Doctor: "We need to run some blood tests - a CBC and metabolic panel"
Expected: Lab order action with test names

// Test follow-up
Doctor: "I'd like to see you back in 2 weeks to check how you're doing"
Expected: Follow-up action with timeframe

// Test multiple actions
Doctor: "Take ibuprofen 400mg every 6 hours for pain, get a chest X-ray, and come back in a month"
Expected: Prescription + diagnostic test + follow-up actions
```

### Medical Terminology Tests

```
- Medication names (brand and generic)
- Anatomical terms
- Procedure names
- Lab test abbreviations
- Vital signs
```

## 📊 Performance Metrics

Monitor these metrics:

1. **Action Detection Rate**: Actions detected / Total medical actions mentioned
2. **False Positive Rate**: Incorrect detections / Total detections
3. **Webhook Success Rate**: Successful webhooks / Total webhook attempts
4. **Summary Generation Time**: Average time to generate summary
5. **Medical Term Accuracy**: Correctly preserved terms / Total medical terms

## 🐛 Common Issues & Solutions

| Issue                    | Solution                                      |
| ------------------------ | --------------------------------------------- |
| Missing medical actions  | Improve detection patterns, add more examples |
| Wrong medication dosage  | Use GPT for extraction, validate format       |
| Webhook timeouts         | Increase timeout, implement retry queue       |
| Poor summary quality     | Improve prompt, add more structure            |
| Medical terms translated | Update OpenAI instructions to preserve terms  |

## 🔒 Security & Compliance Notes

1. **PHI Protection**: Never log patient names or identifiers
2. **Audit Trail**: Log all action validations
3. **Webhook Security**: Use HMAC signatures
4. **Data Retention**: Follow HIPAA guidelines (7 years)
5. **Access Control**: Prepare for role-based access

## ➡️ Deployment Ready!

With medical features complete, the system is ready for:

- Production deployment
- HIPAA compliance review
- Clinical pilot testing
- Performance optimization
- Additional language support

