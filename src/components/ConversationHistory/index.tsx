'use client';

import { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  startedAt: string;
  endedAt?: string;
  languages?: {
    primary: string;
    secondary: string;
  };
  utteranceCount: number;
  actionCount: number;
  hasSummary: boolean;
}

interface ConversationHistoryProps {
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationHistory({ onSelectConversation }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations/list');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In progress';
    
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  const handleSelect = (conversationId: string) => {
    setSelectedId(conversationId);
    onSelectConversation(conversationId);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Conversations</h3>
        <p className="text-gray-500 text-center py-4">Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Conversations</h3>
        <p className="text-gray-500 text-center py-4">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Past Conversations</h3>
        <button
          onClick={fetchConversations}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => handleSelect(conv.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedId === conv.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(conv.startedAt)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDuration(conv.startedAt, conv.endedAt)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                  <span>{conv.utteranceCount} utterances</span>
                  <span>•</span>
                  <span>{conv.actionCount} actions</span>
                  {conv.hasSummary && (
                    <>
                      <span>•</span>
                      <span className="text-green-600">✓ Summary</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                {conv.languages?.primary ? 
                  `${conv.languages.primary.toUpperCase()} → ${conv.languages.secondary.toUpperCase()}` : 
                  'EN → ES'
                }
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}