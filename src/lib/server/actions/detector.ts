import { MedicalTermDetector, type DetectedTerm } from '../medical/terminology';

// Action detail types
interface PrescriptionDetails {
  medication: {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    rxnormCode?: string;
  };
}

interface LabOrderDetails {
  labTest: {
    name: string;
    loincCode?: string;
    urgency?: string;
  };
}

interface ReferralDetails {
  referral: {
    specialty: string;
    reason: string;
    urgency: string;
  };
}

interface FollowUpDetails {
  followUp: {
    timeframe: string;
    reason: string;
  };
}

interface DiagnosticTestDetails {
  test: {
    name: string;
    type?: string;
    urgency?: string;
  };
}

type ActionDetails = PrescriptionDetails | LabOrderDetails | ReferralDetails | FollowUpDetails | DiagnosticTestDetails;

export interface DetectedAction {
  type: 'prescription' | 'lab_order' | 'referral' | 'follow_up' | 'diagnostic_test';
  details: ActionDetails;
  confidence: number;
  utteranceText: string;
  detectedTerms?: string[];
}

export interface ActionContext {
  conversationId: string;
  utteranceId: string;
  role: 'clinician' | 'patient';
}

export class ActionDetector {
  private medicalTermDetector: MedicalTermDetector;

  constructor() {
    this.medicalTermDetector = new MedicalTermDetector();
  }

  async detectActions(
    utterance: string,
    context: ActionContext
  ): Promise<DetectedAction[]> {
    const actions: DetectedAction[] = [];
    
    console.log('[ActionDetector] Detecting actions for:', {
      utterance,
      role: context.role
    });
    
    // Only detect actions from clinician utterances
    if (context.role !== 'clinician') {
      console.log('[ActionDetector] Skipping non-clinician utterance');
      return actions;
    }

    // Detect medical terms first
    const medicalTerms = await this.medicalTermDetector.detectTerms(utterance);
    console.log('[ActionDetector] Medical terms detected:', medicalTerms);

    // Prescription detection
    const prescriptionAction = this.detectPrescription(utterance, medicalTerms);
    console.log('[ActionDetector] Prescription action:', prescriptionAction);
    if (prescriptionAction) {
      actions.push(prescriptionAction);
      console.log('[ActionDetector] Added prescription action to array');
    }

    // Lab order detection
    const labAction = this.detectLabOrder(utterance, medicalTerms);
    if (labAction) {
      actions.push(labAction);
    }

    // Follow-up detection
    const followUpAction = this.detectFollowUp(utterance);
    if (followUpAction) {
      actions.push(followUpAction);
    }

    // Referral detection
    const referralAction = this.detectReferral(utterance);
    if (referralAction) {
      actions.push(referralAction);
    }

    // Diagnostic test detection
    const diagnosticAction = this.detectDiagnosticTest(utterance, medicalTerms);
    if (diagnosticAction) {
      actions.push(diagnosticAction);
    }

    return actions;
  }

  private detectPrescription(utterance: string, medicalTerms: DetectedTerm[]): DetectedAction | null {
    console.log('[detectPrescription] Checking utterance:', utterance);
    
    // Look for medication terms
    const medicationTerms = medicalTerms.filter(term => term.category === 'medication');
    console.log('[detectPrescription] Medication terms found:', medicationTerms);
    
    if (medicationTerms.length === 0) {
      console.log('[detectPrescription] No medication terms found, skipping');
      return null;
    }

    // Check for prescription patterns
    let confidence = 0;
    const medication = medicationTerms[0];
    let dosage = '';
    let frequency = '';
    let duration = '';

    // Extract dosage
    const dosageMatch = utterance.match(/(\d+(?:\.\d+)?)\s*(mg|milligrams?|g|grams?|ml|milliliters?|cc|mcg|micrograms?|units?)/i);
    if (dosageMatch) {
      dosage = dosageMatch[0];
      confidence += 0.3;
      console.log('[detectPrescription] Found dosage:', dosage);
    }

    // Extract frequency
    const frequencyPatterns = [
      /(?:take\s+)?(?:it\s+)?(\w+)\s+(?:times?\s+)?(?:a|per)\s+day/i,
      /(?:every|q)\s*(\d+)\s*(?:hours?|hrs?)/i,
      /(?:twice|three times|four times)\s+(?:a\s+)?(?:day|daily)/i,
      /(?:bid|tid|qid|qd|prn)/i,
    ];

    for (const pattern of frequencyPatterns) {
      const match = utterance.match(pattern);
      if (match) {
        frequency = match[0];
        confidence += 0.2;
        break;
      }
    }

    // Extract duration
    const durationMatch = utterance.match(/for\s+(\d+)\s+(days?|weeks?|months?)/i);
    if (durationMatch) {
      duration = durationMatch[0];
      confidence += 0.2;
    }

    // Check for prescription keywords
    if (/prescribe|prescription|rx/i.test(utterance)) {
      confidence += 0.3;
      console.log('[detectPrescription] Found prescription keyword');
    }

    console.log('[detectPrescription] Final confidence:', confidence);

    // Only return if we have enough confidence
    if (confidence < 0.5) {
      console.log('[detectPrescription] Confidence too low, skipping');
      return null;
    }

    return {
      type: 'prescription',
      details: {
        medication: {
          name: medication.term,
          dosage,
          frequency,
          duration,
          rxnormCode: medication.codes?.rxnorm,
        },
      },
      confidence: Math.min(1.0, confidence + medication.confidence * 0.3),
      utteranceText: utterance,
      detectedTerms: medicationTerms.map(t => t.term),
    };
  }

  private detectLabOrder(utterance: string, medicalTerms: DetectedTerm[]): DetectedAction | null {
    const labTerms = medicalTerms.filter(term => term.category === 'lab');
    
    // Lab order patterns
    const labPatterns = [
      /(?:order|need|get|run|check)\s+(?:a\s+)?(?:blood\s+)?(?:test|work|labs?)/i,
      /(?:blood|lab)\s+(?:test|work)/i,
      /check\s+(?:your\s+)?(\w+)\s+levels?/i,
    ];

    let hasLabPattern = false;
    for (const pattern of labPatterns) {
      if (pattern.test(utterance)) {
        hasLabPattern = true;
        break;
      }
    }

    if (!hasLabPattern && labTerms.length === 0) {
      return null;
    }

    // Determine urgency
    let urgency = 'routine';
    if (/stat|urgent|immediately|right away/i.test(utterance)) {
      urgency = 'stat';
    } else if (/soon|today/i.test(utterance)) {
      urgency = 'urgent';
    }

    // Use the first lab term or generic "blood work"
    const labName = labTerms.length > 0 ? labTerms[0].term : 'blood work';
    const loincCode = labTerms.length > 0 ? labTerms[0].codes?.loinc : undefined;

    return {
      type: 'lab_order',
      details: {
        labTest: {
          name: labName,
          loincCode,
          urgency,
        },
      },
      confidence: hasLabPattern ? 0.9 : 0.7,
      utteranceText: utterance,
      detectedTerms: labTerms.map(t => t.term),
    };
  }

  private detectFollowUp(utterance: string): DetectedAction | null {
    const followUpPatterns = [
      /(?:come\s+back|follow\s*up|see\s+you|return|schedule)\s+(?:in\s+)?(\d+)\s+(days?|weeks?|months?)/i,
      /(?:come\s+back|follow\s*up|see\s+you|return)\s+(?:in\s+)?(?:a\s+)?(week|month|couple\s+of\s+weeks)/i,
      /(?:schedule|make)\s+(?:a\s+)?(?:follow\s*up|appointment)\s+(?:for|in)\s+(\d+)\s+(days?|weeks?|months?)/i,
    ];

    for (const pattern of followUpPatterns) {
      const match = utterance.match(pattern);
      if (match) {
        let timeframe = match[0];
        
        // Clean up the timeframe
        timeframe = timeframe.replace(/(?:come\s+back|follow\s*up|see\s+you|return|schedule)\s+/i, '');
        timeframe = timeframe.replace(/^(?:in|for)\s+/i, '');

        return {
          type: 'follow_up',
          details: {
            followUp: {
              timeframe,
              reason: 'Check progress',
            },
          },
          confidence: 0.85,
          utteranceText: utterance,
        };
      }
    }

    return null;
  }

  private detectReferral(utterance: string): DetectedAction | null {
    const referralPatterns = [
      /refer(?:ring)?\s+(?:you\s+)?to\s+(?:a\s+)?(\w+(?:\s+\w+)?)/i,
      /see\s+(?:a\s+)?(\w+(?:ologist|iatrist))/i,
      /(?:consult|consultation)\s+with\s+(?:a\s+)?(\w+(?:\s+\w+)?)/i,
    ];

    const specialties = [
      'cardiologist', 'dermatologist', 'endocrinologist', 'gastroenterologist',
      'neurologist', 'oncologist', 'orthopedist', 'psychiatrist', 'pulmonologist',
      'rheumatologist', 'urologist', 'nephrologist', 'specialist',
    ];

    for (const pattern of referralPatterns) {
      const match = utterance.match(pattern);
      if (match) {
        const specialty = match[1];
        
        // Check if it's a valid specialty
        const isValidSpecialty = specialties.some(s => 
          specialty.toLowerCase().includes(s) || s.includes(specialty.toLowerCase())
        );

        if (isValidSpecialty || /specialist|doctor/i.test(specialty)) {
          return {
            type: 'referral',
            details: {
              referral: {
                specialty,
                reason: 'Specialized care needed',
                urgency: /urgent|soon|asap/i.test(utterance) ? 'urgent' : 'routine',
              },
            },
            confidence: 0.8,
            utteranceText: utterance,
          };
        }
      }
    }

    return null;
  }

  private detectDiagnosticTest(utterance: string, medicalTerms: DetectedTerm[]): DetectedAction | null {
    const diagnosticTerms = medicalTerms.filter(term => term.category === 'procedure');
    
    const diagnosticPatterns = [
      /(?:order|need|get|schedule)\s+(?:a|an)?\s*(\w+(?:\s+\w+)?)\s*(?:scan|test|imaging)/i,
      /(?:x-?ray|mri|ct\s*scan|ultrasound|echo(?:cardiogram)?)/i,
    ];

    let testName = '';
    let confidence = 0;

    // Check for diagnostic terms
    if (diagnosticTerms.length > 0) {
      testName = diagnosticTerms[0].term;
      confidence = 0.8;
    } else {
      // Check patterns
      for (const pattern of diagnosticPatterns) {
        const match = utterance.match(pattern);
        if (match) {
          testName = match[1] || match[0];
          confidence = 0.7;
          break;
        }
      }
    }

    if (!testName) {
      return null;
    }

    return {
      type: 'diagnostic_test',
      details: {
        test: {
          name: testName,
          type: this.classifyDiagnosticTest(testName),
          urgency: /stat|urgent|immediately/i.test(utterance) ? 'urgent' : 'routine',
        },
      },
      confidence,
      utteranceText: utterance,
      detectedTerms: diagnosticTerms.map(t => t.term),
    };
  }

  private classifyDiagnosticTest(testName: string): string {
    const normalized = testName.toLowerCase();
    
    if (/x-?ray|radiograph/i.test(normalized)) return 'radiology';
    if (/mri|magnetic/i.test(normalized)) return 'mri';
    if (/ct|cat\s*scan|computed/i.test(normalized)) return 'ct';
    if (/ultrasound|echo/i.test(normalized)) return 'ultrasound';
    
    return 'other';
  }
}