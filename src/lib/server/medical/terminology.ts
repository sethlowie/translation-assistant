export interface MedicalTerm {
  term: string;
  category: 'medication' | 'procedure' | 'condition' | 'anatomy' | 'lab';
  synonyms: string[];
  codes?: {
    icd10?: string[];
    rxnorm?: string;
    loinc?: string;
    cpt?: string[];
  };
}

export interface DetectedTerm extends MedicalTerm {
  confidence: number;
  position: number;
  matchedText?: string;
}

export class MedicalTermDetector {
  private terms: Map<string, MedicalTerm>;

  constructor() {
    this.terms = new Map();
    this.loadMedicalDictionary();
  }

  private loadMedicalDictionary(): void {
    // Common medications
    const medications: MedicalTerm[] = [
      {
        term: 'amoxicillin',
        category: 'medication',
        synonyms: ['amoxil'],
        codes: { rxnorm: '723' }
      },
      {
        term: 'ibuprofen',
        category: 'medication',
        synonyms: ['advil', 'motrin'],
        codes: { rxnorm: '5640' }
      },
      {
        term: 'metformin',
        category: 'medication',
        synonyms: ['glucophage'],
        codes: { rxnorm: '6809' }
      },
      {
        term: 'lisinopril',
        category: 'medication',
        synonyms: ['prinivil', 'zestril'],
        codes: { rxnorm: '29046' }
      },
      {
        term: 'aspirin',
        category: 'medication',
        synonyms: ['asa', 'acetylsalicylic acid'],
        codes: { rxnorm: '1191' }
      },
      {
        term: 'tylenol',
        category: 'medication',
        synonyms: ['acetaminophen', 'paracetamol'],
        codes: { rxnorm: '161' }
      },
      {
        term: 'prednisone',
        category: 'medication',
        synonyms: ['deltasone'],
        codes: { rxnorm: '8640' }
      },
      {
        term: 'antibiotic',
        category: 'medication',
        synonyms: ['antibiotics'],
        codes: {}
      },
      {
        term: 'pain medication',
        category: 'medication',
        synonyms: ['pain med', 'pain meds', 'painkiller', 'analgesic'],
        codes: {}
      }
    ];

    // Common conditions
    const conditions: MedicalTerm[] = [
      {
        term: 'diabetes',
        category: 'condition',
        synonyms: ['diabetes mellitus', 'dm'],
        codes: { icd10: ['E11', 'E10'] }
      },
      {
        term: 'hypertension',
        category: 'condition',
        synonyms: ['high blood pressure', 'htn'],
        codes: { icd10: ['I10'] }
      },
      {
        term: 'asthma',
        category: 'condition',
        synonyms: ['reactive airway disease'],
        codes: { icd10: ['J45'] }
      },
      {
        term: 'pneumonia',
        category: 'condition',
        synonyms: ['lung infection'],
        codes: { icd10: ['J18'] }
      }
    ];

    // Common lab tests
    const labs: MedicalTerm[] = [
      {
        term: 'cbc',
        category: 'lab',
        synonyms: ['complete blood count', 'blood count'],
        codes: { loinc: '58410-2' }
      },
      {
        term: 'metabolic panel',
        category: 'lab',
        synonyms: ['bmp', 'basic metabolic panel', 'cmp', 'comprehensive metabolic panel'],
        codes: { loinc: '24323-8' }
      },
      {
        term: 'glucose',
        category: 'lab',
        synonyms: ['blood sugar', 'blood glucose'],
        codes: { loinc: '2345-7' }
      },
      {
        term: 'hemoglobin a1c',
        category: 'lab',
        synonyms: ['hba1c', 'a1c', 'glycated hemoglobin'],
        codes: { loinc: '4548-4' }
      }
    ];

    // Common procedures
    const procedures: MedicalTerm[] = [
      {
        term: 'x-ray',
        category: 'procedure',
        synonyms: ['radiograph', 'xray'],
        codes: { cpt: ['70000-79999'] }
      },
      {
        term: 'mri',
        category: 'procedure',
        synonyms: ['magnetic resonance imaging'],
        codes: { cpt: ['70336', '70540-70543'] }
      },
      {
        term: 'ct scan',
        category: 'procedure',
        synonyms: ['cat scan', 'computed tomography'],
        codes: { cpt: ['70450-70498'] }
      }
    ];

    // Common anatomy terms
    const anatomy: MedicalTerm[] = [
      {
        term: 'heart',
        category: 'anatomy',
        synonyms: ['cardiac', 'coronary'],
        codes: {}
      },
      {
        term: 'lung',
        category: 'anatomy',
        synonyms: ['pulmonary', 'respiratory'],
        codes: {}
      },
      {
        term: 'liver',
        category: 'anatomy',
        synonyms: ['hepatic'],
        codes: {}
      },
      {
        term: 'kidney',
        category: 'anatomy',
        synonyms: ['renal'],
        codes: {}
      }
    ];

    // Load all terms into the map
    [...medications, ...conditions, ...labs, ...procedures, ...anatomy].forEach(term => {
      this.terms.set(term.term.toLowerCase(), term);
    });
  }

  async detectTerms(text: string): Promise<DetectedTerm[]> {
    const detected: DetectedTerm[] = [];
    const normalized = text.toLowerCase();
    
    console.log('[MedicalTermDetector] Detecting terms in:', text);
    console.log('[MedicalTermDetector] Dictionary size:', this.terms.size);

    // Check each term in dictionary
    for (const [key, term] of this.terms) {
      const regex = new RegExp(`\\b${this.escapeRegex(key)}\\b`, 'i');
      const match = regex.exec(normalized);
      if (match) {
        console.log('[MedicalTermDetector] Found term:', key, 'at position:', match.index);
        detected.push({
          ...term,
          confidence: 1.0,
          position: match.index,
          matchedText: match[0]
        });
      }

      // Check synonyms
      for (const synonym of term.synonyms) {
        const synonymRegex = new RegExp(`\\b${this.escapeRegex(synonym)}\\b`, 'i');
        const synonymMatch = synonymRegex.exec(normalized);
        if (synonymMatch) {
          detected.push({
            ...term,
            confidence: 0.9,
            position: synonymMatch.index,
            matchedText: synonymMatch[0]
          });
        }
      }
    }

    // Check for dosage patterns (e.g., "500mg", "10 ml")
    const dosagePattern = /\b(\d+(?:\.\d+)?)\s*(mg|g|ml|cc|mcg|units?|tablets?|pills?)\b/gi;
    let dosageMatch: RegExpExecArray | null;
    while ((dosageMatch = dosagePattern.exec(text)) !== null) {
      // Find if this dosage is near a medication term
      const nearbyMedication = detected.find(term => 
        term.category === 'medication' && 
        Math.abs(term.position - dosageMatch!.index) < 50
      );
      if (nearbyMedication) {
        nearbyMedication.confidence = Math.min(1.0, nearbyMedication.confidence + 0.1);
      }
    }

    // Remove duplicates and sort by position
    const uniqueDetected = this.removeDuplicates(detected);
    return uniqueDetected.sort((a, b) => a.position - b.position);
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private removeDuplicates(terms: DetectedTerm[]): DetectedTerm[] {
    const seen = new Map<string, DetectedTerm>();
    
    for (const term of terms) {
      const key = `${term.term}-${term.position}`;
      const existing = seen.get(key);
      
      if (!existing || existing.confidence < term.confidence) {
        seen.set(key, term);
      }
    }
    
    return Array.from(seen.values());
  }

  private calculateConfidence(term: MedicalTerm, context: string): number {
    let confidence = 0.8;

    // Boost confidence if term appears with typical medical context
    const medicalContextPatterns = [
      /prescribe|prescription|take|medication/i,
      /diagnos|condition|disease|disorder/i,
      /test|lab|result|level/i,
      /procedure|surgery|operation/i
    ];

    for (const pattern of medicalContextPatterns) {
      if (pattern.test(context)) {
        confidence += 0.05;
      }
    }

    return Math.min(1.0, confidence);
  }
}