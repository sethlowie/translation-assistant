# Test Script: Lab Orders and Diagnostic Tests

## Scenario
Patient with fatigue and unexplained weight loss. Tests lab ordering, diagnostic test scheduling, and referral detection.

## Conversation Flow

### 1. Chief Complaint

**CLINICIAN (English):**
"Good afternoon. I understand you've been feeling very tired lately?"

**Expected AI Translation to Spanish:**
"Buenas tardes. ¿Entiendo que se ha sentido muy cansado últimamente?"

**PATIENT (Spanish):**
"Sí, doctor. Estoy muy cansado todo el tiempo y he perdido como diez libras sin hacer dieta."
*(Translation: Yes, doctor. I'm very tired all the time and I've lost about ten pounds without dieting.)*

**Expected AI Translation to English:**
"Yes, doctor. I'm very tired all the time and I've lost about ten pounds without dieting."

**Expected Detections:**
- Medical terms: "tired" (cansado), "weight loss" (pérdida de peso)
- Symptoms: fatigue, unintentional weight loss (10 lbs)

---

### 2. Additional Symptoms

**CLINICIAN (English):**
"How long has this been going on? Any night sweats or fevers?"

**Expected AI Translation to Spanish:**
"¿Cuánto tiempo ha estado pasando esto? ¿Algún sudor nocturno o fiebre?"

**PATIENT (Spanish):**
"Como dos meses. Sí, sudo mucho por las noches y a veces tengo escalofríos."
*(Translation: About two months. Yes, I sweat a lot at night and sometimes have chills.)*

**Expected AI Translation to English:**
"About two months. Yes, I sweat a lot at night and sometimes have chills."

**Expected Detections:**
- Medical terms: "night sweats" (sudores nocturnos), "chills" (escalofríos)
- Symptoms: 2-month duration, night sweats, chills

---

### 3. Lab Orders - Basic Panel

**CLINICIAN (English):**
"I need to order some blood tests. First, I'm ordering a complete blood count and comprehensive metabolic panel."

**Expected AI Translation to Spanish:**
"Necesito ordenar algunos análisis de sangre. Primero, ordenaré un conteo sanguíneo completo y un panel metabólico completo."

**Expected Detections:**
- Medical terms: "blood tests" (análisis de sangre), "complete blood count", "metabolic panel"
- **ACTION DETECTED**: Lab Order #1
  - Type: lab_order
  - Tests: CBC (Complete Blood Count)
- **ACTION DETECTED**: Lab Order #2
  - Type: lab_order
  - Tests: CMP (Comprehensive Metabolic Panel)

---

### 4. Additional Lab Orders

**CLINICIAN (English):**
"I'm also ordering thyroid function tests, specifically TSH and Free T4, and we'll check your vitamin D levels."

**Expected AI Translation to Spanish:**
"También ordenaré pruebas de función tiroidea, específicamente TSH y T4 libre, y verificaremos sus niveles de vitamina D."

**Expected Detections:**
- Medical terms: "thyroid function" (función tiroidea), "TSH", "T4", "vitamin D"
- **ACTION DETECTED**: Lab Order #3
  - Type: lab_order
  - Tests: TSH, Free T4
- **ACTION DETECTED**: Lab Order #4
  - Type: lab_order
  - Tests: Vitamin D level

---

### 5. Diagnostic Imaging

**CLINICIAN (English):**
"Given your symptoms, I want to order a chest X-ray to rule out any lung issues."

**Expected AI Translation to Spanish:**
"Dados sus síntomas, quiero ordenar una radiografía de tórax para descartar cualquier problema pulmonar."

**PATIENT (Spanish):**
"¿Cree que podría ser algo serio?"
*(Translation: Do you think it could be something serious?)*

**Expected AI Translation to English:**
"Do you think it could be something serious?"

**Expected Detections:**
- Medical terms: "chest X-ray" (radiografía de tórax), "lung" (pulmonar)
- **ACTION DETECTED**: Diagnostic Test
  - Type: diagnostic_test
  - Test: Chest X-ray
  - Reason: rule out lung pathology

---

### 6. Specialist Referral

**CLINICIAN (English):**
"Let's see what the tests show first. If needed, I'll refer you to a hematologist. The blood work should be ready in two days."

**Expected AI Translation to Spanish:**
"Veamos primero qué muestran las pruebas. Si es necesario, lo referiré a un hematólogo. Los análisis de sangre deberían estar listos en dos días."

**Expected Detections:**
- Medical terms: "hematologist" (hematólogo), "blood work" (análisis de sangre)
- **ACTION DETECTED**: Potential Referral
  - Type: referral
  - Specialist: hematologist
  - Condition: pending test results

---

### 7. Follow-up Instructions

**CLINICIAN (English):**
"Please go to the lab downstairs for the blood draw. The X-ray can be done today in radiology. Call me in three days for results, or sooner if you feel worse."

**Expected AI Translation to Spanish:**
"Por favor vaya al laboratorio abajo para la extracción de sangre. La radiografía se puede hacer hoy en radiología. Llámeme en tres días para los resultados, o antes si se siente peor."

**Expected Detections:**
- **ACTION DETECTED**: Follow-up
  - Timeframe: 3 days
  - Purpose: review test results
- **ACTION DETECTED**: Patient Instruction
  - Go to lab for blood draw
  - Get X-ray in radiology today
  - Call if symptoms worsen

---

## Expected Summary Output

### Chief Complaint
Fatigue and unintentional weight loss (10 lbs over 2 months)

### History of Present Illness
Patient reports 2 months of progressive fatigue with unintentional 10-pound weight loss. Associated with night sweats and chills. No reported fever.

### Tests Ordered
**Laboratory:**
1. Complete Blood Count (CBC)
2. Comprehensive Metabolic Panel (CMP)
3. Thyroid Function Tests (TSH, Free T4)
4. Vitamin D level

**Imaging:**
1. Chest X-ray - to rule out pulmonary pathology

### Follow-up Plan
- Review results in 3 days
- Potential hematology referral pending results

### Patient Instructions
- Complete lab work downstairs
- Obtain chest X-ray in radiology today
- Call in 3 days for results
- Return sooner if symptoms worsen

### Total Actions Detected
- 4 Lab orders
- 1 Diagnostic test
- 1 Potential referral
- 1 Follow-up instruction
- 1 Patient instruction set

### Medical Terms Count
20+ terms including: fatigue, weight loss, night sweats, chills, CBC, CMP, thyroid function, TSH, T4, vitamin D, chest X-ray, hematologist