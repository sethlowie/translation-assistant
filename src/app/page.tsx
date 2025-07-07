import { VoiceChat } from "@/components/VoiceChat";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <main className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Medical Language Interpreter
          </h1>
          <p className="text-lg text-gray-600">
            Phase 1: MVP Voice Chat Demo
          </p>
        </div>
        
        <VoiceChat />
      </main>
    </div>
  );
}
