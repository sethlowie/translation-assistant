# Test Script: Multiple Prescriptions Scenario

## Scenario
A diabetic patient with high blood pressure needs medication adjustments. Tests multiple prescription detections and complex medication instructions.

## Conversation Flow

### 1. Opening & Current Medications Review

**CLINICIAN (English):**
"Hello Mrs. Garcia. I see you're here for your diabetes and blood pressure follow-up. What medications are you currently taking?"

**Expected AI Translation to Spanish:**
"Hola Sra. García. Veo que está aquí para su seguimiento de diabetes y presión arterial. ¿Qué medicamentos está tomando actualmente?"

**PATIENT (Spanish):**
"Estoy tomando metformina dos veces al día y lisinopril por la mañana."
*(Translation: I'm taking metformin twice a day and lisinopril in the morning.)*

**Expected AI Translation to English:**
"I'm taking metformin twice a day and lisinopril in the morning."

**Expected Detections:**
- Medical terms: "diabetes", "blood pressure" (presión arterial), "metformin" (metformina), "lisinopril"
- Current medications noted

---

### 2. Lab Results Discussion

**CLINICIAN (English):**
"Your blood sugar levels are still a bit high. Your A1C is 8.2. I'd like to add another medication."

**Expected AI Translation to Spanish:**
"Sus niveles de azúcar en sangre todavía están un poco altos. Su A1C es 8.2. Me gustaría agregar otro medicamento."

**PATIENT (Spanish):**
"¿Es muy alto? Me he estado cuidando con la dieta."
*(Translation: Is it very high? I've been watching my diet.)*

**Expected AI Translation to English:**
"Is it very high? I've been watching my diet."

**Expected Detections:**
- Medical terms: "blood sugar" (azúcar en sangre), "A1C"
- Lab value: A1C = 8.2

---

### 3. First Prescription

**CLINICIAN (English):**
"I'm going to prescribe glipizide 5 milligrams. Take one tablet twice daily with breakfast and dinner."

**Expected AI Translation to Spanish:**
"Voy a recetarle glipizida 5 miligramos. Tome una tableta dos veces al día con el desayuno y la cena."

**Expected Detections:**
- Medical terms: "glipizide" (glipizida)
- **ACTION DETECTED**: Prescription #1
  - Type: prescription
  - Medication: glipizide
  - Dosage: 5mg
  - Frequency: twice daily
  - Instructions: with breakfast and dinner

---

### 4. Blood Pressure Adjustment

**CLINICIAN (English):**
"Your blood pressure is also running high. Let's increase your lisinopril to 20 milligrams once daily."

**Expected AI Translation to Spanish:**
"Su presión arterial también está alta. Aumentemos su lisinopril a 20 miligramos una vez al día."

**Expected Detections:**
- Medical terms: "blood pressure", "lisinopril"
- **ACTION DETECTED**: Prescription #2 (Adjustment)
  - Type: prescription
  - Medication: lisinopril
  - Dosage: 20mg (increased from previous)
  - Frequency: once daily

---

### 5. Cholesterol Management

**CLINICIAN (English):**
"I also want to start you on atorvastatin 40 milligrams at bedtime for your cholesterol."

**Expected AI Translation to Spanish:**
"También quiero comenzarle con atorvastatina 40 miligramos al acostarse para su colesterol."

**PATIENT (Spanish):**
"¿Tantas pastillas? ¿Hay efectos secundarios?"
*(Translation: So many pills? Are there side effects?)*

**Expected AI Translation to English:**
"So many pills? Are there side effects?"

**Expected Detections:**
- Medical terms: "atorvastatin" (atorvastatina), "cholesterol" (colesterol)
- **ACTION DETECTED**: Prescription #3
  - Type: prescription
  - Medication: atorvastatin
  - Dosage: 40mg
  - Frequency: once daily
  - Instructions: at bedtime

---

### 6. Side Effects Discussion

**CLINICIAN (English):**
"The glipizide can cause low blood sugar, so monitor your levels. The statin might cause muscle aches. Let me know if you experience any problems."

**Expected AI Translation to Spanish:**
"La glipizida puede causar azúcar baja en sangre, así que monitoree sus niveles. La estatina puede causar dolores musculares. Avíseme si experimenta algún problema."

**Expected Detections:**
- Medical terms: "low blood sugar" (azúcar baja), "muscle aches" (dolores musculares)
- **ACTION DETECTED**: Patient instruction
  - Monitor blood sugar levels
  - Watch for muscle aches

---

### 7. Summary and Refills

**CLINICIAN (English):**
"So to summarize: Continue metformin as before, increase lisinopril to 20mg, add glipizide 5mg twice daily, and start atorvastatin 40mg at bedtime. I'm sending all prescriptions to your pharmacy."

**Expected AI Translation to Spanish:**
"Para resumir: Continúe con metformina como antes, aumente lisinopril a 20mg, agregue glipizida 5mg dos veces al día, y comience atorvastatina 40mg al acostarse. Enviaré todas las recetas a su farmacia."

**Expected Detections:**
- Confirmation of all prescriptions
- **ACTION DETECTED**: Prescription summary confirmed

---

## Expected Summary Output

### Medications Prescribed
1. Glipizide 5mg PO BID with meals (new)
2. Lisinopril 20mg PO daily (increased from previous dose)
3. Atorvastatin 40mg PO at bedtime (new)
4. Continue Metformin as previously prescribed

### Lab Values Noted
- Hemoglobin A1C: 8.2% (elevated)

### Patient Instructions
- Monitor blood glucose levels closely due to new medication
- Report any muscle aches or weakness
- Continue dietary management

### Total Actions Detected
- 3 Prescriptions
- 1 Patient instruction set
- 0 Lab orders (results discussed only)

### Medical Terms Count
15+ medical terms including: diabetes, blood pressure, metformin, lisinopril, glipizide, atorvastatin, cholesterol, A1C, blood sugar, muscle aches