'use client';

import { useState, useEffect } from 'react';

export function DetectionModeToggle() {
  const [useAI, setUseAI] = useState(true);

  useEffect(() => {
    // Check current mode from environment or localStorage
    const savedMode = localStorage.getItem('detectionMode');
    if (savedMode === 'regex') {
      setUseAI(false);
    }
  }, []);

  const handleToggle = () => {
    const newMode = !useAI;
    setUseAI(newMode);
    
    // Save preference
    localStorage.setItem('detectionMode', newMode ? 'ai' : 'regex');
    
    // Note: Detection mode is now stored in localStorage and sent with each API call
    // This avoids the need for global window modifications
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Detection Mode
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {useAI ? 'AI-Powered (OpenAI Tools)' : 'Rule-Based (Regex)'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            useAI ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          aria-label="Toggle detection mode"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              useAI ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-600">
        <p className="font-medium mb-1">
          {useAI ? 'AI Detection Features:' : 'Regex Detection Features:'}
        </p>
        <ul className="space-y-1 text-gray-500">
          {useAI ? (
            <>
              <li>• Uses OpenAI function calling</li>
              <li>• Context-aware detection</li>
              <li>• Handles complex phrases</li>
              <li>• Multi-language support</li>
            </>
          ) : (
            <>
              <li>• Fast pattern matching</li>
              <li>• No API calls needed</li>
              <li>• Predictable results</li>
              <li>• Lower latency</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}