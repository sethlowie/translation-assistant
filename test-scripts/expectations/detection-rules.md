# Detection Rules and Expected Behavior

## Medical Term Detection

### Terms Detected in Both Languages

| English | Spanish | Detection Confidence |
|---------|---------|---------------------|
| pain | dolor | High |
| fever | fiebre | High |
| headache | dolor de cabeza | High |
| nausea | náuseas | High |
| vomiting | vómitos | High |
| diarrhea | diarrea | High |
| cough | tos | High |
| blood pressure | presión arterial | High |
| diabetes | diabetes | High |
| heart | corazón | High |
| stomach | estómago | High |
| kidney | riñón/riñones | High |
| liver | hígado | High |
| medication | medicamento/medicina | High |

### Medication Names (Universal)
- Metformin / Metformina
- Lisinopril / Lisinopril
- Omeprazole / Omeprazol
- Insulin / Insulina
- Aspirin / Aspirina
- Ibuprofen / Ibuprofeno
- Amlodipine / Amlodipino
- Atorvastatin / Atorvastatina

## Action Detection Patterns

### Prescription Detection

**Trigger Phrases:**
- "I'm prescribing..." / "Le receto..."
- "I'm going to prescribe..." / "Voy a recetar..."
- "Take [medication]..." / "Tome [medicamento]..."
- "Start [medication]..." / "Comience [medicamento]..."
- "Increase [medication] to..." / "Aumente [medicamento] a..."

**Required Information:**
1. Medication name
2. Dosage (mg, units, etc.)
3. Frequency (once daily, twice daily, etc.)
4. Optional: Duration, special instructions

**Example Patterns:**
```
"I'm prescribing omeprazole 20 milligrams once daily"
→ Detects: Prescription {
    medication: "omeprazole",
    dosage: "20mg",
    frequency: "once daily"
}
```

### Lab Order Detection

**Trigger Phrases:**
- "I'm ordering..." / "Ordenaré..."
- "Let's check..." / "Revisemos..."
- "We need to test..." / "Necesitamos probar..."
- "I want a..." / "Quiero un/una..."

**Common Lab Tests:**
- CBC (Complete Blood Count) / Conteo sanguíneo completo
- CMP (Comprehensive Metabolic Panel) / Panel metabólico
- Hemoglobin A1C / Hemoglobina A1C
- Lipid panel / Panel de lípidos
- TSH / TSH
- Urinalysis / Análisis de orina

### Referral Detection

**Trigger Phrases:**
- "I'm referring you to..." / "Lo refiero a..."
- "You need to see a..." / "Necesita ver a un..."
- "I'll send you to..." / "Lo enviaré a..."

**Specialists Detected:**
- Cardiologist / Cardiólogo
- Endocrinologist / Endocrinólogo
- Neurologist / Neurólogo
- Ophthalmologist / Oftalmólogo
- Podiatrist / Podólogo
- Hematologist / Hematólogo

### Follow-up Detection

**Trigger Phrases:**
- "Come back in..." / "Regrese en..."
- "Follow up in..." / "Seguimiento en..."
- "See me again in..." / "Véame otra vez en..."
- "Return if..." / "Regrese si..."

**Time Patterns:**
- X days / X días
- X weeks / X semanas
- X months / X meses

### Diagnostic Test Detection

**Common Tests:**
- X-ray / Radiografía
- CT scan / Tomografía
- MRI / Resonancia magnética
- Ultrasound / Ultrasonido
- EKG/ECG / Electrocardiograma
- Echocardiogram / Ecocardiograma

### Patient Instruction Detection

**Trigger Patterns:**
- "Avoid..." / "Evite..."
- "Don't..." / "No..."
- "Make sure to..." / "Asegúrese de..."
- "You should..." / "Debería..."
- "Remember to..." / "Recuerde..."
- "Check your..." / "Revise su..."
- "Monitor..." / "Monitoree..."

## Confidence Scoring

### High Confidence (0.8-1.0)
- Clear medication name with dosage and frequency
- Explicit lab test names
- Direct referral statements
- Specific follow-up timeframes

### Medium Confidence (0.6-0.79)
- Partial medication information
- Implied lab orders
- Conditional referrals
- Vague timeframes

### Low Confidence (0.4-0.59)
- Ambiguous medication mentions
- General test discussions
- Possible referrals
- Unclear instructions

## Summary Generation Rules

### Section Mapping

1. **Chief Complaint**
   - First patient symptom mentioned
   - "What brings you in?" responses

2. **History of Present Illness**
   - Symptom duration
   - Associated symptoms
   - Aggravating/alleviating factors

3. **Assessment and Plan**
   - Diagnoses mentioned
   - Treatment rationale
   - Overall plan

4. **Medications Discussed**
   - All prescriptions
   - Dosage adjustments
   - Discontinued medications

5. **Tests Ordered**
   - Laboratory tests
   - Imaging studies
   - Other diagnostics

6. **Follow-up Instructions**
   - Return visit timing
   - Conditional returns
   - Monitoring instructions

## Edge Cases and Special Handling

### Multi-lingual Medical Terms
Some terms remain the same:
- COVID, COVID-19
- CT, MRI, EKG
- pH, O2

### Compound Actions
"I'm ordering CBC, CMP, and lipid panel" 
→ Creates 3 separate lab orders

### Conditional Actions
"If not better in 2 weeks, we'll refer to GI"
→ Creates referral with conditional flag

### Dosage Variations
- "20 mg" = "20mg" = "20 milligrams" = "veinte miligramos"
- "twice daily" = "BID" = "two times a day" = "dos veces al día"
- "at bedtime" = "HS" = "before sleep" = "al acostarse"

## Webhook Triggers

### Immediate Webhooks
- Prescriptions with controlled substances
- Urgent referrals
- Critical lab values mentioned

### Batch Webhooks
- End of conversation summary
- All actions for a conversation
- Daily summary of all conversations