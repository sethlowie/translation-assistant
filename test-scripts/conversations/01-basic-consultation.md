# Test Script: Basic Consultation

## Scenario
A patient visits with stomach pain. This script tests basic translation and medical term detection.

## Conversation Flow

### 1. Initial Greeting & Chief Complaint

**CLINICIAN (English):**
"Good morning, I'm Dr. Smith. What brings you in today?"

**Expected AI Translation to Spanish:**
"Buenos días, soy el Dr. Smith. ¿Qué lo trae hoy?"

**PATIENT (Spanish):**
"Buenos días doctor. Me duele mucho el estómago desde hace tres días."
*(Translation: Good morning doctor. My stomach has been hurting a lot for three days.)*

**Expected AI Translation to English:**
"Good morning doctor. My stomach has been hurting a lot for three days."

**Expected Detections:**
- Medical terms: "stomach" (estómago)
- No actions yet

---

### 2. Symptom Details

**CLINICIAN (English):**
"Can you describe the pain? Is it sharp or dull?"

**Expected AI Translation to Spanish:**
"¿Puede describir el dolor? ¿Es agudo o sordo?"

**PATIENT (Spanish):**
"Es un dolor punzante, especialmente después de comer. También tengo náuseas."
*(Translation: It's a sharp pain, especially after eating. I also have nausea.)*

**Expected AI Translation to English:**
"It's a sharp pain, especially after eating. I also have nausea."

**Expected Detections:**
- Medical terms: "pain" (dolor), "nausea" (náuseas)
- Symptoms extracted: sharp pain, post-meal pain, nausea

---

### 3. Medical History

**CLINICIAN (English):**
"Have you had any fever or vomiting?"

**Expected AI Translation to Spanish:**
"¿Ha tenido fiebre o vómitos?"

**PATIENT (Spanish):**
"No tengo fiebre, pero vomité una vez ayer."
*(Translation: I don't have a fever, but I vomited once yesterday.)*

**Expected AI Translation to English:**
"I don't have a fever, but I vomited once yesterday."

**Expected Detections:**
- Medical terms: "fever" (fiebre), "vomiting" (vómitos)
- Symptoms: vomiting (1 episode)

---

### 4. Assessment

**CLINICIAN (English):**
"Based on your symptoms, it sounds like you might have gastritis. I'd like to prescribe some medication for you."

**Expected AI Translation to Spanish:**
"Basándome en sus síntomas, parece que podría tener gastritis. Me gustaría recetarle algunos medicamentos."

**Expected Detections:**
- Medical terms: "gastritis", "medication"
- Potential diagnosis: gastritis
- Action preview: prescription coming

---

### 5. Treatment Plan

**CLINICIAN (English):**
"I'm prescribing omeprazole 20 milligrams, take one capsule every morning before breakfast for two weeks."

**Expected AI Translation to Spanish:**
"Le receto omeprazol 20 miligramos, tome una cápsula cada mañana antes del desayuno durante dos semanas."

**Expected Detections:**
- Medical terms: "omeprazole"
- **ACTION DETECTED**: Prescription
  - Type: prescription
  - Medication: omeprazole
  - Dosage: 20mg
  - Frequency: once daily
  - Duration: 2 weeks
  - Instructions: before breakfast

---

### 6. Follow-up Instructions

**CLINICIAN (English):**
"Please come back in two weeks if you're not feeling better. Avoid spicy foods and alcohol."

**Expected AI Translation to Spanish:**
"Por favor regrese en dos semanas si no se siente mejor. Evite las comidas picantes y el alcohol."

**Expected Detections:**
- **ACTION DETECTED**: Follow-up
  - Timeframe: 2 weeks
  - Condition: if symptoms persist
- **ACTION DETECTED**: Patient instruction
  - Dietary restrictions: avoid spicy foods and alcohol

---

## Expected Summary Output

### Chief Complaint
Stomach pain for 3 days

### History of Present Illness
Patient reports sharp, stabbing epigastric pain for 3 days, worse after meals. Associated with nausea. One episode of vomiting yesterday. Denies fever.

### Assessment and Plan
Likely gastritis. Started on PPI therapy.

### Medications Prescribed
- Omeprazole 20mg PO daily before breakfast x 2 weeks

### Patient Instructions
- Avoid spicy foods and alcohol
- Return in 2 weeks if symptoms persist

### Medical Terms Detected
stomach, pain, nausea, fever, vomiting, gastritis, medication, omeprazole

### Actions Summary
- 1 Prescription issued
- 1 Follow-up scheduled
- 1 Patient instruction given