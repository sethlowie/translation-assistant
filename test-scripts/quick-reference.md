# Quick Reference Card for Testing

## 🚀 Quick Test Phrases

### For English Speakers (Clinician Role)

#### Opening
- "Hello, what brings you in today?"
- "How can I help you?"

#### Common Questions
- "How long has this been going on?"
- "Does it hurt when you...?"
- "Any fever or chills?"
- "Are you taking any medications?"

#### Prescribing (Triggers Action)
- "I'm prescribing [medication] [dose] [frequency]"
- "Take ibuprofen 400 milligrams three times daily"
- "Start metformin 500 milligrams twice daily with meals"

#### Ordering Tests (Triggers Action)
- "I'm ordering a complete blood count"
- "Let's check your thyroid with a TSH test"
- "We need a chest X-ray"

#### Referrals (Triggers Action)
- "I'm referring you to a cardiologist"
- "You need to see an eye doctor"

### For Spanish Speakers (Patient Role)

#### Common Complaints
- "Me duele la cabeza" (My head hurts)
- "Tengo fiebre" (I have a fever)
- "No puedo dormir" (I can't sleep)
- "Me siento mareado" (I feel dizzy)

#### Describing Pain
- "Es un dolor agudo" (It's a sharp pain)
- "Me duele aquí" (It hurts here)
- "El dolor va y viene" (The pain comes and goes)

#### Time Expressions
- "Desde hace tres días" (For three days)
- "Empezó ayer" (It started yesterday)
- "Por la noche" (At night)

#### Yes/No Responses
- "Sí, tengo..." (Yes, I have...)
- "No, no tengo..." (No, I don't have...)
- "A veces" (Sometimes)

## 🔥 One-Minute Test

### Clinician Says:
1. "What brings you in today?"
2. "How long have you had this pain?"
3. "I'm prescribing ibuprofen 200 milligrams every 6 hours"
4. "Come back in one week"

### Patient Says:
1. "Me duele el estómago"
2. "Tres días"
3. "¿Con comida?"
4. "Gracias doctor"

### Expected Results:
- ✅ 4 translations each way
- ✅ 1 prescription detected
- ✅ 1 follow-up detected
- ✅ Medical terms: pain, stomach, ibuprofen

## 📋 Action Cheat Sheet

### To Trigger a Prescription:
Say: "I'm prescribing [drug] [dose] [frequency]"
- ✅ "I'm prescribing amoxicillin 500 milligrams three times daily"
- ❌ "Maybe try some amoxicillin" (too vague)

### To Trigger a Lab Order:
Say: "I'm ordering [test name]"
- ✅ "I'm ordering a CBC and metabolic panel"
- ❌ "We should check your blood" (too vague)

### To Trigger a Referral:
Say: "I'm referring you to [specialist]"
- ✅ "I'm referring you to a neurologist"
- ❌ "You might want to see a neurologist" (too vague)

### To Trigger Follow-up:
Say: "Come back in [timeframe]"
- ✅ "Follow up in two weeks"
- ❌ "Come back sometime" (no timeframe)

## 🎯 Testing Goals

1. **First Test**: Just get translations working
2. **Second Test**: Trigger one prescription
3. **Third Test**: Trigger multiple action types
4. **Fourth Test**: Complete a full conversation with summary

## 💡 Pro Tips

- Speak clearly and pause between sentences
- Use numbers for dosages (not "twenty" but "20")
- State actions explicitly ("I'm ordering..." not "Let's do...")
- End conversation before generating summary
- Check the action panel after each clinician statement