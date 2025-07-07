'use client';

import { useState, useEffect, useRef } from 'react';
import { RealtimeClient, ConnectionStatus } from '@/lib/client/webrtc/RealtimeClient';
import { useAppDispatch, useAppSelector } from '@/lib/client/store/hooks';
import { 
  startConversation, 
  endConversation, 
  addUtterance, 
  updateUtteranceTranslation,
  setProcessing,
  addAction,
  type Action
} from '@/lib/client/store/conversationSlice';

export function VoiceChat() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);
  const dispatch = useAppDispatch();
  const languages = useAppSelector((state) => state.conversation.languages);
  const conversationId = useAppSelector((state) => state.conversation.id);
  const utterances = useAppSelector((state) => state.conversation.utterances);
  const lastUtteranceIdRef = useRef<string | null>(null);
  const getUtterancesRef = useRef<() => typeof utterances>(() => []);

  // Keep the ref updated with current utterances
  useEffect(() => {
    getUtterancesRef.current = () => utterances;
  }, [utterances]);

  useEffect(() => {
    // Initialize client
    const client = new RealtimeClient();
    
    // Set up event listeners
    client.on('statusChanged', (newStatus) => {
      setStatus(newStatus);
      if (newStatus !== 'error') {
        setError(null);
      }
    });

    client.on('error', (err) => {
      setError(err.message);
      console.error('VoiceChat error:', err);
    });

    client.on('utterance', async (event) => {
      console.log('VoiceChat: utterance event received', event);
      const utterance = {
        role: event.role,
        originalText: event.originalText,
        language: event.language,
        timestamp: event.timestamp,
      };
      dispatch(addUtterance(utterance));
    });

    client.on('translation', (event) => {
      console.log('VoiceChat: translation event received', event);
      // Get the last utterance ID from the Redux store using ref
      const currentUtterances = getUtterancesRef.current();
      if (currentUtterances.length > 0) {
        const lastUtterance = currentUtterances[currentUtterances.length - 1];
        if (!lastUtterance.translatedText) {
          console.log('Updating utterance translation:', lastUtterance.id, event.translatedText);
          dispatch(updateUtteranceTranslation({
            id: lastUtterance.id,
            translatedText: event.translatedText,
          }));
        }
      }
    });

    client.on('speechStart', () => {
      dispatch(setProcessing(true));
    });

    client.on('speechEnd', () => {
      dispatch(setProcessing(false));
    });

    clientRef.current = client;

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [dispatch]);

  // Update lastUtteranceIdRef when utterances change and save to database
  useEffect(() => {
    if (utterances.length > 0) {
      const lastUtterance = utterances[utterances.length - 1];
      lastUtteranceIdRef.current = lastUtterance.id;
      
      // Save to database and detect actions if conversation is active
      if (conversationId && !lastUtterance.translatedText) {
        // Only save if it's a new utterance (no translation yet)
        const saveAndDetect = async () => {
          try {
            // Save utterance
            const utteranceResponse = await fetch('/api/utterances', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conversationId,
                role: lastUtterance.role,
                originalLanguage: lastUtterance.language,
                originalText: lastUtterance.originalText,
                timestamp: lastUtterance.timestamp,
                sequenceNumber: lastUtterance.sequenceNumber,
              }),
            });

            if (utteranceResponse.ok) {
              const utteranceData = await utteranceResponse.json();
              
              // Detect actions if it's a clinician utterance
              if (lastUtterance.role === 'clinician') {
                const detectionMode = localStorage.getItem('detectionMode') || 'ai';
                const actionResponse = await fetch('/api/actions/detect', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    utteranceId: utteranceData.data.id,
                    conversationId,
                    utterance: lastUtterance.originalText,
                    role: lastUtterance.role,
                    detectionMode,
                  }),
                });

                if (actionResponse.ok) {
                  const { actions } = await actionResponse.json();
                  // Add detected actions to Redux store
                  interface ActionResponse {
                    id: string;
                    type: Action['type'];
                    details: Action['details'];
                    confidence: number;
                  }
                  
                  actions.forEach((action: ActionResponse) => {
                    dispatch(addAction({
                      id: action.id,
                      type: action.type,
                      details: action.details,
                      confidence: action.confidence,
                      validated: false,
                    }));
                  });
                }
              }
            }
          } catch (error) {
            console.error('Failed to save utterance or detect actions:', error);
          }
        };

        saveAndDetect();
      }
    }
  }, [utterances, conversationId, dispatch]);

  const handleStart = async () => {
    try {
      setError(null);
      if (clientRef.current) {
        // Create conversation in database first
        const conversationResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: languages }),
        });

        if (!conversationResponse.ok) {
          throw new Error('Failed to create conversation');
        }

        const { data } = await conversationResponse.json();
        
        // Start Redux conversation
        dispatch(startConversation({ 
          id: data.id, 
          languages 
        }));

        // Connect WebRTC with language config
        await clientRef.current.connect({ languages });
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start conversation');
    }
  };

  const handleStop = async () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    
    if (conversationId) {
      // End conversation in database
      await fetch(`/api/conversations/${conversationId}/end`, {
        method: 'POST',
      });
    }
    
    dispatch(endConversation());
  };

  const handleRepeat = () => {
    if (clientRef.current && status === 'connected') {
      clientRef.current.repeatLast();
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'error':
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to start';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected - You can speak now';
      case 'error':
        return 'Connection error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Voice Chat</h2>
        <p className="text-gray-600">Click Start to begin a voice conversation</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {status === 'connected' && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Microphone active</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button
          onClick={handleStart}
          disabled={status === 'connecting' || status === 'connected'}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'connecting' ? 'Connecting...' : 'Start Conversation'}
        </button>

        <button
          onClick={handleStop}
          disabled={status !== 'connected' && status !== 'connecting'}
          className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Stop
        </button>

        {status === 'connected' && (
          <button
            onClick={handleRepeat}
            className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            title="Repeat last translation"
          >
            Repeat
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        <p>Microphone permission will be requested when you start</p>
      </div>

      {/* Hidden audio element for remote audio playback */}
      <audio id="audio-output" autoPlay className="hidden" />
    </div>
  );
}