# Test Script: Comprehensive Medical Visit

## Scenario
A complex case with multiple conditions: diabetes follow-up with new complications. Tests all action types and complex medical terminology.

## Conversation Flow

### 1. Initial Assessment

**CLINICIAN (English):**
"Hello Mr. Rodriguez. I see you're here for your diabetes check-up. How have you been feeling?"

**Expected AI Translation to Spanish:**
"Hola Sr. Rodríguez. Veo que está aquí para su chequeo de diabetes. ¿Cómo se ha sentido?"

**PATIENT (Spanish):**
"Doctor, no me he sentido bien. Tengo hormigueo en los pies y veo borroso a veces."
*(Translation: Doctor, I haven't been feeling well. I have tingling in my feet and blurry vision sometimes.)*

**Expected AI Translation to English:**
"Doctor, I haven't been feeling well. I have tingling in my feet and blurry vision sometimes."

**Expected Detections:**
- Medical terms: "diabetes", "tingling" (hormigueo), "blurry vision" (visión borrosa)
- Symptoms suggesting: diabetic neuropathy, possible retinopathy

---

### 2. Vital Signs and Physical Exam

**CLINICIAN (English):**
"Your blood pressure is 150 over 95, which is high. Let me examine your feet for sensation."

**Expected AI Translation to Spanish:**
"Su presión arterial es 150 sobre 95, lo cual es alto. Déjeme examinar sus pies para verificar la sensación."

**PATIENT (Spanish):**
"¿Es muy alta la presión? También he notado que orino mucho por la noche."
*(Translation: Is the pressure very high? I've also noticed I urinate a lot at night.)*

**Expected AI Translation to English:**
"Is the pressure very high? I've also noticed I urinate a lot at night."

**Expected Detections:**
- Medical terms: "blood pressure" (presión arterial), "urinate" (orinar)
- Vital signs: BP 150/95
- Symptoms: nocturia

---

### 3. Lab Orders for Diabetic Monitoring

**CLINICIAN (English):**
"I need to order several tests. First, hemoglobin A1C, fasting glucose, and a lipid panel to check your cholesterol."

**Expected AI Translation to Spanish:**
"Necesito ordenar varias pruebas. Primero, hemoglobina A1C, glucosa en ayunas y un panel de lípidos para verificar su colesterol."

**Expected Detections:**
- **ACTION DETECTED**: Lab Order #1
  - Tests: Hemoglobin A1C, Fasting glucose, Lipid panel
- Medical terms: "hemoglobin A1C", "fasting glucose" (glucosa en ayunas), "lipid panel", "cholesterol"

---

### 4. Kidney Function Assessment

**CLINICIAN (English):**
"I'm also ordering a urine test for microalbumin and blood tests for creatinine and eGFR to check your kidney function."

**Expected AI Translation to Spanish:**
"También ordenaré una prueba de orina para microalbúmina y análisis de sangre para creatinina y eGFR para verificar su función renal."

**Expected Detections:**
- **ACTION DETECTED**: Lab Order #2
  - Tests: Urine microalbumin, Creatinine, eGFR
- Medical terms: "microalbumin" (microalbúmina), "creatinine" (creatinina), "kidney function" (función renal)

---

### 5. Medication Adjustments

**CLINICIAN (English):**
"Your current metformin isn't controlling your diabetes well enough. I'm adding insulin glargine, 10 units at bedtime. Start with this dose and we'll adjust based on your morning blood sugars."

**Expected AI Translation to Spanish:**
"Su metformina actual no está controlando bien su diabetes. Agregaré insulina glargina, 10 unidades al acostarse. Comience con esta dosis y ajustaremos según sus niveles de azúcar matutinos."

**Expected Detections:**
- **ACTION DETECTED**: Prescription
  - Medication: Insulin glargine
  - Dosage: 10 units
  - Frequency: at bedtime
  - Instructions: adjust based on morning glucose
- Medical terms: "insulin glargine" (insulina glargina), "blood sugars" (azúcar en sangre)

---

### 6. Blood Pressure Management

**CLINICIAN (English):**
"For your high blood pressure, I'm prescribing amlodipine 5 milligrams once daily. This should help protect your kidneys too."

**Expected AI Translation to Spanish:**
"Para su presión alta, le recetaré amlodipino 5 miligramos una vez al día. Esto también debería ayudar a proteger sus riñones."

**Expected Detections:**
- **ACTION DETECTED**: Prescription
  - Medication: Amlodipine
  - Dosage: 5mg
  - Frequency: once daily
- Medical terms: "amlodipine" (amlodipino), "kidneys" (riñones)

---

### 7. Specialist Referrals

**CLINICIAN (English):**
"I'm referring you to an ophthalmologist for a diabetic eye exam, and to a podiatrist for your foot numbness. Both are urgent referrals."

**Expected AI Translation to Spanish:**
"Lo referiré a un oftalmólogo para un examen ocular diabético, y a un podólogo para el entumecimiento de sus pies. Ambas son referencias urgentes."

**Expected Detections:**
- **ACTION DETECTED**: Referral #1
  - Specialist: Ophthalmologist
  - Reason: Diabetic eye exam
  - Urgency: Urgent
- **ACTION DETECTED**: Referral #2
  - Specialist: Podiatrist
  - Reason: Foot numbness/neuropathy
  - Urgency: Urgent
- Medical terms: "ophthalmologist" (oftalmólogo), "podiatrist" (podólogo), "diabetic eye exam"

---

### 8. Patient Education

**CLINICIAN (English):**
"You need to check your blood sugar twice daily - before breakfast and at bedtime. Keep a log and bring it to your next visit. Also, examine your feet daily for any cuts or sores."

**Expected AI Translation to Spanish:**
"Necesita revisar su azúcar en sangre dos veces al día - antes del desayuno y al acostarse. Mantenga un registro y tráigalo a su próxima visita. También, examine sus pies diariamente por cortaduras o llagas."

**Expected Detections:**
- **ACTION DETECTED**: Patient Instructions
  - Check blood sugar twice daily (fasting and bedtime)
  - Keep glucose log
  - Daily foot examination
- Medical terms: "cuts" (cortaduras), "sores" (llagas)

---

### 9. Diagnostic Test and Follow-up

**CLINICIAN (English):**
"I'm also ordering an EKG today to check your heart, given your high blood pressure and diabetes. Please schedule a follow-up in one month."

**Expected AI Translation to Spanish:**
"También ordenaré un EKG hoy para revisar su corazón, dado su presión alta y diabetes. Por favor programe un seguimiento en un mes."

**Expected Detections:**
- **ACTION DETECTED**: Diagnostic Test
  - Test: EKG
  - Reason: Cardiac evaluation (HTN + DM)
- **ACTION DETECTED**: Follow-up
  - Timeframe: 1 month
- Medical terms: "EKG", "heart" (corazón)

---

## Expected Summary Output

### Chief Complaint
Diabetes follow-up with new symptoms of peripheral neuropathy and visual changes

### History of Present Illness
Patient with known diabetes mellitus reports tingling in feet and intermittent blurry vision. Also notes nocturia. Blood pressure elevated at 150/95.

### Assessment and Plan
1. Diabetes mellitus, poorly controlled - likely with neuropathy and possible retinopathy
2. Hypertension, uncontrolled
3. Possible diabetic nephropathy - needs evaluation

### Medications Prescribed
1. Insulin glargine 10 units subcutaneous at bedtime (new)
2. Amlodipine 5mg PO daily (new)
3. Continue Metformin as previously prescribed

### Tests Ordered
**Laboratory:**
- Hemoglobin A1C
- Fasting glucose
- Lipid panel
- Urine microalbumin
- Serum creatinine with eGFR

**Diagnostic:**
- EKG (performed today)

### Referrals
1. Ophthalmology - URGENT - diabetic eye exam
2. Podiatry - URGENT - evaluate peripheral neuropathy

### Patient Instructions
- Check blood glucose twice daily (fasting and bedtime)
- Maintain glucose log
- Daily foot inspection for injuries
- Follow up in 1 month

### Total Actions Detected
- 2 Prescriptions
- 2 Lab order sets
- 1 Diagnostic test
- 2 Referrals
- 1 Follow-up
- 3 Patient instructions

### Medical Terms Count
35+ terms including: diabetes, neuropathy, retinopathy, hypertension, A1C, glucose, insulin, creatinine, microalbumin, ophthalmologist, podiatrist, EKG