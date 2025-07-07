'use client';

import { useState, useEffect, useRef } from 'react';
import { RealtimeClient, ConnectionStatus } from '@/lib/client/webrtc/RealtimeClient';

export function VoiceChat() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);

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

    clientRef.current = client;

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  const handleStart = async () => {
    try {
      setError(null);
      if (clientRef.current) {
        await clientRef.current.connect();
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start conversation');
    }
  };

  const handleStop = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
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
      </div>

      <div className="text-xs text-gray-500 text-center">
        <p>Microphone permission will be requested when you start</p>
      </div>

      {/* Hidden audio element for remote audio playback */}
      <audio id="audio-output" autoPlay className="hidden" />
    </div>
  );
}