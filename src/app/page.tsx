'use client';

import { VoiceChat } from "@/components/VoiceChat";
import { LanguageToggle } from "@/components/LanguageToggle";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { ActionPanel } from "@/components/ActionPanel";
import { DetectionModeToggle } from "@/components/DetectionModeToggle";
import { WebhookConfig } from "@/components/WebhookConfig";
import { ConversationSummary } from "@/components/ConversationSummary";

export default function Home() {
  return (
    <div className="py-8">
      <main className="max-w-5xl mx-auto px-4">
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
          
          {/* Main Content Grid - Two columns now */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Voice & Actions */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Voice Controls
                </h2>
                <VoiceChat />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Medical Actions
                </h2>
                <div className="space-y-4">
                  <DetectionModeToggle />
                  <WebhookConfig />
                  <ActionPanel />
                </div>
              </div>
            </div>
            
            {/* Right Column - Transcript & Summary */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Conversation Transcript
                </h2>
                <TranscriptDisplay />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Clinical Summary
                </h2>
                <ConversationSummary />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
