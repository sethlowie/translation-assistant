import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const sessionRequestSchema = z.object({
  primaryLanguage: z.enum(["en", "es"]).default("en"),
  secondaryLanguage: z.enum(["en", "es"]).default("es"),
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const { primaryLanguage, secondaryLanguage } = sessionRequestSchema.parse(body);

    // Create language-specific instructions
    const instructions = `
      You are a medical interpreter facilitating communication between an ${primaryLanguage === "en" ? "English" : "Spanish"}-speaking 
      healthcare provider and a ${secondaryLanguage === "es" ? "Spanish" : "English"}-speaking patient.
      
      CRITICAL RULES:
      1. Translate ONLY what is spoken - no additions, notes, or commentary
      2. NEVER translate medical terminology - keep medication names, dosages, and medical terms in their original form
      3. Preserve ALL numbers, measurements, and time periods exactly as stated
      4. Keep medical abbreviations unchanged (CBC, MRI, CT, mg, ml, etc.)
      
      Translation process:
      1. Identify the speaker (doctor or patient) based on context
      2. Translate conversational parts to the other language
      3. Keep ALL medical terms in their original form
      4. Speak only the translation itself
      
      Examples:
      - "Take amoxicillin 500mg twice daily" → "Tome amoxicillin 500mg dos veces al día"
      - "Necesito una MRI del knee" → "I need an MRI of the knee"
      - "Your glucose is 126" → "Su glucose es 126"
      
      If someone says "repeat that" or "can you say that again", repeat the last translation.
      
      Always maintain a professional, neutral tone and ensure medical accuracy.
    `;

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: primaryLanguage === "es" ? "nova" : "verse",
          instructions,
          input_audio_transcription: {
            model: "whisper-1",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        token: data.client_secret.value,
        sessionId: data.id,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        languages: {
          primary: primaryLanguage,
          secondary: secondaryLanguage,
        },
      },
    });
  } catch (error) {
    console.error("Session creation failed:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid language configuration",
          details: error.errors 
        },
        { status: 400 },
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create session" 
      },
      { status: 500 },
    );
  }
}