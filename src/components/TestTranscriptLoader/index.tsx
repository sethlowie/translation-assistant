'use client';

import { useState } from 'react';

interface TestScript {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    speaker: 'clinician' | 'patient';
    language: 'English' | 'Spanish';
    text: string;
    expectedActions?: string[];
  }>;
}

const testScripts: TestScript[] = [
  {
    id: '1',
    name: 'Basic Consultation',
    description: 'Simple stomach pain visit with prescription',
    steps: [
      {
        speaker: 'clinician',
        language: 'English',
        text: 'Good morning, what brings you in today?',
      },
      {
        speaker: 'patient',
        language: 'Spanish',
        text: 'Me duele mucho el estómago desde hace tres días.',
      },
      {
        speaker: 'clinician',
        language: 'English',
        text: 'I\'m prescribing omeprazole 20 milligrams, take one every morning.',
        expectedActions: ['Prescription: omeprazole 20mg'],
      },
      {
        speaker: 'clinician',
        language: 'English',
        text: 'Come back in two weeks if you\'re not feeling better.',
        expectedActions: ['Follow-up: 2 weeks'],
      },
    ],
  },
  {
    id: '2',
    name: 'Multiple Prescriptions',
    description: 'Diabetes management with multiple medications',
    steps: [
      {
        speaker: 'clinician',
        language: 'English',
        text: 'Your blood sugar is high. I need to adjust your medications.',
      },
      {
        speaker: 'patient',
        language: 'Spanish',
        text: '¿Necesito más medicamentos?',
      },
      {
        speaker: 'clinician',
        language: 'English',
        text: 'I\'m prescribing metformin 1000 milligrams twice daily.',
        expectedActions: ['Prescription: metformin 1000mg'],
      },
      {
        speaker: 'clinician',
        language: 'English',
        text: 'Also, glipizide 5 milligrams once daily with breakfast.',
        expectedActions: ['Prescription: glipizide 5mg'],
      },
    ],
  },
  {
    id: '3',
    name: 'Lab Orders',
    description: 'Chest pain evaluation with labs',
    steps: [
      {
        speaker: 'clinician',
        language: 'English',
        text: 'Tell me about your chest pain.',
      },
      {
        speaker: 'patient',
        language: 'Spanish',
        text: 'Me duele el pecho cuando respiro profundo.',
      },
      {
        speaker: 'clinician',
        language: 'English',
        text: 'I\'m ordering a complete blood count and chest x-ray.',
        expectedActions: ['Lab order: CBC', 'Diagnostic test: chest x-ray'],
      },
      {
        speaker: 'clinician',
        language: 'English',
        text: 'I\'m also ordering a troponin level stat.',
        expectedActions: ['Lab order: troponin (STAT)'],
      },
    ],
  },
  {
    id: '4',
    name: 'Referral & Follow-up',
    description: 'Complex case with specialist referral',
    steps: [
      {
        speaker: 'clinician',
        language: 'English',
        text: 'Your symptoms are concerning. I think you need to see a specialist.',
      },
      {
        speaker: 'patient',
        language: 'Spanish',
        text: '¿Es algo grave?',
      },
      {
        speaker: 'clinician',
        language: 'English',
        text: 'I\'m referring you to cardiology for further evaluation.',
        expectedActions: ['Referral: cardiology'],
      },
      {
        speaker: 'clinician',
        language: 'English',
        text: 'Follow up with me in one week after your cardiology appointment.',
        expectedActions: ['Follow-up: 1 week'],
      },
    ],
  },
];

export function TestTranscriptLoader() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<TestScript | null>(null);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="font-medium">Test Scripts</span>
        <span className="text-xs bg-orange-600 px-2 py-0.5 rounded-full">DEV</span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-[600px] bg-white border-2 border-orange-200 rounded-lg shadow-xl z-50 max-h-[80vh] overflow-y-auto">
          <div className="bg-orange-50 border-b border-orange-200 p-4 sticky top-0">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Test Scripts - Development Only</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Practice conversations to demonstrate features. Click a scenario to see the script.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Script Selection */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {testScripts.map((script) => (
                <button
                  key={script.id}
                  onClick={() => setSelectedScript(script)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedScript?.id === script.id
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-gray-900">{script.name}</div>
                  <div className="text-sm text-gray-600">{script.description}</div>
                </button>
              ))}
            </div>

            {/* Selected Script Display */}
            {selectedScript && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">{selectedScript.name} - Script</h4>
                <div className="space-y-3">
                  {selectedScript.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        step.speaker === 'clinician' 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-green-50 border border-green-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium text-sm ${
                          step.speaker === 'clinician' ? 'text-blue-700' : 'text-green-700'
                        }`}>
                          {step.speaker === 'clinician' ? '👨‍⚕️ Clinician' : '🧑 Patient'} ({step.language})
                        </span>
                        <span className="text-xs text-gray-500">Step {index + 1}</span>
                      </div>
                      <div className="text-gray-900 font-medium mb-1">
                        Say: &ldquo;{step.text}&rdquo;
                      </div>
                      {step.expectedActions && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-600 mb-1">Expected actions:</div>
                          <div className="flex flex-wrap gap-1">
                            {step.expectedActions.map((action, i) => (
                              <span
                                key={i}
                                className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded"
                              >
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Tip:</strong> Start a new conversation, then read these lines aloud. 
                    The system should translate and detect the medical actions automatically.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 border-t border-gray-200 p-3">
            <p className="text-xs text-gray-500 text-center">
              ⚠️ This is a development tool for testing - not for production use
            </p>
          </div>
        </div>
      )}
    </div>
  );
}