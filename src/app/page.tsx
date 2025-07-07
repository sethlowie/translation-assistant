import { VoiceChat } from "@/components/VoiceChat";
import { LanguageToggle } from "@/components/LanguageToggle";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Medical Language Interpreter
          </h1>
          <p className="text-lg text-gray-600">
            Real-time English-Spanish medical interpretation with translation
          </p>
        </div>
        
        <div className="space-y-8">
          <div className="flex justify-center">
            <LanguageToggle />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Voice Controls
              </h2>
              <VoiceChat />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Conversation Transcript
              </h2>
              <TranscriptDisplay />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
