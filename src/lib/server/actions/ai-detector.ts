import { DetectedAction, ActionContext } from './detector';

// Type definition for OpenAI tool
interface ChatCompletionTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// Tool definitions for OpenAI function calling
const medicalActionTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'detect_prescription',
      description: 'Detects when a healthcare provider prescribes medication to a patient',
      parameters: {
        type: 'object',
        properties: {
          medication: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'The name of the medication (keep in original form, do not translate)'
              },
              dosage: {
                type: 'string',
                description: 'Dosage amount and unit (e.g., "500mg", "10ml")'
              },
              frequency: {
                type: 'string',
                description: 'How often to take (e.g., "twice daily", "every 8 hours")'
              },
              duration: {
                type: 'string',
                description: 'How long to take (e.g., "for 7 days", "for 2 weeks")'
              },
              route: {
                type: 'string',
                enum: ['oral', 'topical', 'injection', 'inhalation', 'other'],
                description: 'Route of administration'
              }
            },
            required: ['name']
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0 and 1'
          }
        },
        required: ['medication', 'confidence']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'detect_lab_order',
      description: 'Detects when a healthcare provider orders laboratory tests',
      parameters: {
        type: 'object',
        properties: {
          labTest: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the lab test (e.g., "CBC", "glucose", "cholesterol panel")'
              },
              urgency: {
                type: 'string',
                enum: ['routine', 'urgent', 'stat'],
                description: 'Urgency level of the test'
              },
              reason: {
                type: 'string',
                description: 'Clinical reason for ordering the test'
              }
            },
            required: ['name']
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0 and 1'
          }
        },
        required: ['labTest', 'confidence']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'detect_referral',
      description: 'Detects when a healthcare provider refers a patient to a specialist',
      parameters: {
        type: 'object',
        properties: {
          referral: {
            type: 'object',
            properties: {
              specialty: {
                type: 'string',
                description: 'Medical specialty (e.g., "cardiologist", "dermatologist")'
              },
              reason: {
                type: 'string',
                description: 'Reason for the referral'
              },
              urgency: {
                type: 'string',
                enum: ['routine', 'urgent', 'emergent'],
                description: 'Urgency of the referral'
              }
            },
            required: ['specialty', 'reason', 'urgency']
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0 and 1'
          }
        },
        required: ['referral', 'confidence']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'detect_follow_up',
      description: 'Detects when a healthcare provider schedules a follow-up appointment',
      parameters: {
        type: 'object',
        properties: {
          followUp: {
            type: 'object',
            properties: {
              timeframe: {
                type: 'string',
                description: 'When to follow up (e.g., "in 2 weeks", "in 3 months")'
              },
              reason: {
                type: 'string',
                description: 'Reason for follow-up'
              },
              type: {
                type: 'string',
                enum: ['in-person', 'telemedicine', 'phone', 'any'],
                description: 'Type of follow-up visit'
              }
            },
            required: ['timeframe', 'reason']
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0 and 1'
          }
        },
        required: ['followUp', 'confidence']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'detect_diagnostic_test',
      description: 'Detects when a healthcare provider orders imaging or diagnostic procedures',
      parameters: {
        type: 'object',
        properties: {
          test: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the test (e.g., "chest X-ray", "MRI brain", "ECG")'
              },
              type: {
                type: 'string',
                enum: ['radiology', 'mri', 'ct', 'ultrasound', 'cardiac', 'other'],
                description: 'Type of diagnostic test'
              },
              urgency: {
                type: 'string',
                enum: ['routine', 'urgent', 'stat'],
                description: 'Urgency of the test'
              },
              indication: {
                type: 'string',
                description: 'Clinical indication for the test'
              }
            },
            required: ['name', 'type']
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0 and 1'
          }
        },
        required: ['test', 'confidence']
      }
    }
  }
];

export class AIActionDetector {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
  }

  async detectActions(
    utterance: string,
    context: ActionContext
  ): Promise<DetectedAction[]> {
    console.log('[AIActionDetector] Detecting actions using AI for:', utterance);

    // Only detect actions from clinician utterances
    if (context.role !== 'clinician') {
      console.log('[AIActionDetector] Skipping non-clinician utterance');
      return [];
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a medical language processing assistant. Analyze healthcare provider utterances and detect medical actions using the provided tools. 
              
              Important rules:
              1. Only call tools if you detect a clear medical action
              2. Preserve medical terminology exactly as spoken (do not translate or modify)
              3. Set confidence based on how clear and explicit the action is
              4. Multiple actions can be detected from a single utterance
              5. Do not infer actions that are not explicitly stated`
            },
            {
              role: 'user',
              content: utterance
            }
          ],
          tools: medicalActionTools,
          tool_choice: 'auto',
          temperature: 0.1, // Low temperature for consistent detection
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const message = data.choices[0]?.message;
      
      if (!message?.tool_calls) {
        console.log('[AIActionDetector] No actions detected by AI');
        return [];
      }

      // Process tool calls into DetectedAction objects
      const actions: DetectedAction[] = [];
      
      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        console.log('[AIActionDetector] Tool called:', toolCall.function.name, args);
        
        switch (toolCall.function.name) {
          case 'detect_prescription':
            actions.push({
              type: 'prescription',
              details: {
                medication: {
                  name: args.medication.name,
                  dosage: args.medication.dosage,
                  frequency: args.medication.frequency,
                  duration: args.medication.duration,
                  rxnormCode: undefined, // Could be enhanced with RxNorm lookup
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
              detectedTerms: [args.medication.name]
            });
            break;
            
          case 'detect_lab_order':
            actions.push({
              type: 'lab_order',
              details: {
                labTest: {
                  name: args.labTest.name,
                  urgency: args.labTest.urgency,
                  loincCode: undefined, // Could be enhanced with LOINC lookup
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
              detectedTerms: [args.labTest.name]
            });
            break;
            
          case 'detect_referral':
            actions.push({
              type: 'referral',
              details: {
                referral: {
                  specialty: args.referral.specialty,
                  reason: args.referral.reason,
                  urgency: args.referral.urgency
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
            });
            break;
            
          case 'detect_follow_up':
            actions.push({
              type: 'follow_up',
              details: {
                followUp: {
                  timeframe: args.followUp.timeframe,
                  reason: args.followUp.reason
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
            });
            break;
            
          case 'detect_diagnostic_test':
            actions.push({
              type: 'diagnostic_test',
              details: {
                test: {
                  name: args.test.name,
                  type: args.test.type,
                  urgency: args.test.urgency
                }
              },
              confidence: args.confidence,
              utteranceText: utterance,
              detectedTerms: [args.test.name]
            });
            break;
        }
      }
      
      console.log('[AIActionDetector] Detected actions:', actions);
      return actions;
      
    } catch (error) {
      console.error('[AIActionDetector] Error detecting actions:', error);
      return [];
    }
  }
}