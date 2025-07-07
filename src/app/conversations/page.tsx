'use client';

import { useState } from 'react';
import { ConversationHistory } from '@/components/ConversationHistory';
import { ConversationSummary } from '@/components/ConversationSummary';
import { useAppDispatch } from '@/lib/client/store/hooks';
import { loadConversation } from '@/lib/client/store/conversationSlice';

export default function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    
    try {
      // Load conversation details into Redux
      const response = await fetch(`/api/conversations/${conversationId}/details`);
      if (response.ok) {
        const data = await response.json();
        
        // Update Redux store with loaded conversation
        dispatch(loadConversation({
          id: data.conversation.id,
          languages: data.conversation.languages,
          utterances: data.utterances,
          actions: data.actions,
        }));
      }
      
      // Load the summary for the selected conversation
      if (typeof window !== 'undefined') {
        const loadSummaryFn = (window as { loadConversationSummary?: (id: string) => void }).loadConversationSummary;
        if (loadSummaryFn) {
          loadSummaryFn(conversationId);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Past Conversations</h2>
        <p className="mt-1 text-sm text-gray-600">
          View and review previous medical interpretation sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation List */}
        <div>
          <ConversationHistory onSelectConversation={handleSelectConversation} />
        </div>

        {/* Summary Panel */}
        <div>
          {selectedConversationId ? (
            <ConversationSummary />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Summary</h3>
              <p className="text-gray-500 text-center py-8">
                Select a conversation from the list to view its clinical summary
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}