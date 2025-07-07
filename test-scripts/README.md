# Medical Interpreter Test Scripts

This directory contains conversation scripts for testing the medical interpreter application. Each script includes both English and Spanish phrases with expected translations and system detections.

## 📁 Directory Structure

```
test-scripts/
├── conversations/          # Scripted medical conversations
│   ├── 01-basic-consultation.md
│   ├── 02-prescription-scenario.md
│   ├── 03-lab-orders-scenario.md
│   └── 04-comprehensive-visit.md
└── expectations/          # Expected system behavior
    └── detection-rules.md
```

## 🎯 Test Scenarios

### 1. Basic Consultation (01-basic-consultation.md)
- **Focus**: Simple stomach pain consultation
- **Tests**: Basic translation, medical term detection, single prescription
- **Difficulty**: Beginner
- **Key Phrases**: 
  - "Me duele el estómago" (My stomach hurts)
  - "Tengo náuseas" (I have nausea)

### 2. Prescription Scenario (02-prescription-scenario.md)
- **Focus**: Multiple medication management
- **Tests**: Complex prescriptions, dosage adjustments
- **Difficulty**: Intermediate
- **Key Medications**: metformin, lisinopril, glipizide, atorvastatin

### 3. Lab Orders Scenario (03-lab-orders-scenario.md)
- **Focus**: Diagnostic workup for fatigue
- **Tests**: Multiple lab orders, imaging requests, potential referral
- **Difficulty**: Intermediate
- **Key Tests**: CBC, CMP, TSH, Chest X-ray

### 4. Comprehensive Visit (04-comprehensive-visit.md)
- **Focus**: Complex diabetic patient with complications
- **Tests**: All action types, multiple referrals, patient education
- **Difficulty**: Advanced
- **Complications**: Neuropathy, retinopathy, hypertension

## 🗣️ How to Use These Scripts

### For Clinicians (English Speakers)
1. Start the voice chat in the application
2. Set your language to English
3. Read the **CLINICIAN** parts aloud
4. Wait for the Spanish translation to appear
5. Listen for the patient's response and its English translation

### For Patients (Spanish Speakers)
1. Wait for the clinician to speak
2. Listen for the Spanish translation
3. Read the **PATIENT** parts aloud
4. The system will translate your Spanish to English

### Solo Testing (Alternating Roles)
1. You can play both roles by switching between reading clinician and patient parts
2. Pause between utterances to let the system process
3. Check that the expected detections match what appears in the UI

## ✅ What to Verify

### Translation Quality
- [ ] Translations appear quickly (< 2 seconds)
- [ ] Medical terms are preserved correctly
- [ ] Context is maintained in translations

### Medical Term Detection
- [ ] Common terms highlighted (dolor, fiebre, medication names)
- [ ] Term count increases appropriately
- [ ] Both English and Spanish medical terms detected

### Action Detection
Each script lists expected actions. Verify:
- [ ] Prescriptions captured with correct details
- [ ] Lab orders identified properly
- [ ] Referrals noted with urgency
- [ ] Follow-up timeframes detected
- [ ] Patient instructions recorded

### Summary Generation
After conversation ends:
- [ ] Chief complaint accurately captured
- [ ] All medications listed correctly
- [ ] Lab orders summarized
- [ ] Action counts match expectations

## 🔍 Common Spanish Medical Phrases

### Symptoms
- "Me duele..." = "It hurts..." / "I have pain in..."
- "Tengo..." = "I have..."
- "Me siento..." = "I feel..."

### Time Expressions
- "Desde hace..." = "For..." (duration)
- "Hace ... días/semanas" = "... days/weeks ago"
- "Por la mañana/noche" = "In the morning/night"

### Responses
- "Sí" = "Yes"
- "No" = "No"
- "A veces" = "Sometimes"
- "Siempre" = "Always"
- "Nunca" = "Never"

## 🐛 Troubleshooting

### If translations don't appear:
1. Check microphone permissions
2. Speak clearly and pause between sentences
3. Ensure you selected the correct language

### If actions aren't detected:
1. Use the exact medication names from scripts
2. Include dosage and frequency clearly
3. State "I'm prescribing..." or "I'm ordering..."

### If the summary is incomplete:
1. End the conversation properly with the Stop button
2. Wait for all utterances to process
3. Click "Generate Summary" only after conversation ends

## 📊 Expected Success Metrics

- **Translation Accuracy**: >95% for medical terms
- **Action Detection**: >90% for clearly stated actions
- **Medical Term Detection**: >85% for common terms
- **Summary Completeness**: All major points captured

## 🎓 Learning Tips

1. **Start Simple**: Begin with the basic consultation script
2. **Practice Pronunciation**: Medical terms should be clear
3. **Natural Pacing**: Speak normally, not too fast or slow
4. **Review Detections**: Check the action panel after each clinician utterance
5. **Compare Summary**: Match the generated summary against expected output