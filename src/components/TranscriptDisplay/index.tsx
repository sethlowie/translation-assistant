'use client';

import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/lib/client/store/hooks';

export function TranscriptDisplay() {
  const utterances = useAppSelector((state) => state.conversation.utterances);
  const isProcessing = useAppSelector((state) => state.conversation.isProcessing);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new utterances are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [utterances]);

  const getRoleDisplay = (role: 'clinician' | 'patient') => {
    return role === 'clinician' 
      ? { icon: '👨‍⚕️', label: 'Doctor' }
      : { icon: '🧑', label: 'Patient' };
  };

  const getLanguageFlag = (lang: 'en' | 'es') => {
    return lang === 'en' ? '🇺🇸' : '🇪🇸';
  };

  if (utterances.length === 0) {
    return (
      <div className="h-96 border border-gray-200 rounded-lg p-8 flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Start speaking to see the conversation transcript...
        </p>
      </div>
    );
  }

  return (
    <div className="h-96 border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div 
        ref={scrollRef}
        className="h-full overflow-y-auto p-4 space-y-4"
      >
        {utterances.map((utterance) => {
          const role = getRoleDisplay(utterance.role);
          return (
            <div key={utterance.id} className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1 font-medium">
                  <span>{role.icon}</span>
                  <span>{role.label}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>{getLanguageFlag(utterance.language)}</span>
                  <span>{utterance.language.toUpperCase()}</span>
                </span>
                <span className="text-xs">
                  {new Date(utterance.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="pl-8 space-y-1">
                <p className="text-gray-900">{utterance.originalText}</p>
                {utterance.translatedText && (
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    <p className="text-blue-600 italic">
                      {utterance.translatedText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {isProcessing && (
          <div className="pl-8 flex items-center gap-2 text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}