'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/client/store/hooks';
import { updateActionValidation, type Action } from '@/lib/client/store/conversationSlice';

export function ActionPanel() {
  const actions = useAppSelector((state) => state.conversation.actions);
  const conversationId = useAppSelector((state) => state.conversation.id);
  const [validating, setValidating] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const handleValidate = async (actionId: string) => {
    setValidating(actionId);
    
    try {
      // Get webhook configuration from localStorage
      const webhookUrl = localStorage.getItem('webhookUrl');
      const webhookEnabled = localStorage.getItem('webhookEnabled') === 'true';
      
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      // Add webhook URL to headers if enabled
      if (webhookEnabled && webhookUrl) {
        headers['x-webhook-url'] = webhookUrl;
      }
      
      const response = await fetch(`/api/actions/${actionId}/validate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversationId }),
      });

      if (response.ok) {
        dispatch(updateActionValidation({ id: actionId, validated: true }));
        
        // If webhook was triggered, update the action with pending webhook status
        const result = await response.json();
        if (result.webhookTriggered) {
          // The webhook status will be updated asynchronously by the backend
          console.log('Webhook triggered for action:', actionId);
        }
      }
    } catch (error) {
      console.error('Failed to validate action:', error);
    } finally {
      setValidating(null);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'prescription':
        return '💊';
      case 'lab_order':
        return '🔬';
      case 'referral':
        return '👨‍⚕️';
      case 'follow_up':
        return '📅';
      case 'diagnostic_test':
        return '🏥';
      default:
        return '📋';
    }
  };

  const formatActionDetails = (action: Action) => {
    switch (action.type) {
      case 'prescription':
        if ('medication' in action.details) {
          const med = action.details.medication;
          return (
            <div className="space-y-1">
              <p className="font-medium text-gray-900">{med.name}</p>
              {med.dosage && <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>}
              {med.frequency && <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>}
              {med.duration && <p className="text-sm text-gray-600">Duration: {med.duration}</p>}
            </div>
          );
        }
        break;
      
      case 'lab_order':
        if ('labTest' in action.details) {
          return (
            <div className="space-y-1">
              <p className="font-medium text-gray-900">{action.details.labTest.name}</p>
              {action.details.labTest.urgency && (
                <p className="text-sm text-gray-600">
                  Urgency: <span className={`font-medium ${
                    action.details.labTest.urgency === 'stat' ? 'text-red-600' :
                    action.details.labTest.urgency === 'urgent' ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>{action.details.labTest.urgency}</span>
                </p>
              )}
            </div>
          );
        }
        break;
      
      case 'follow_up':
        if ('followUp' in action.details) {
          return (
            <div className="space-y-1">
              <p className="font-medium text-gray-900">Follow-up in {action.details.followUp.timeframe}</p>
              <p className="text-sm text-gray-600">Reason: {action.details.followUp.reason}</p>
            </div>
          );
        }
        break;
      
      case 'referral':
        if ('referral' in action.details) {
          return (
            <div className="space-y-1">
              <p className="font-medium text-gray-900">Referral to {action.details.referral.specialty}</p>
              <p className="text-sm text-gray-600">Reason: {action.details.referral.reason}</p>
              {action.details.referral.urgency && (
                <p className="text-sm text-gray-600">
                  Urgency: <span className={`font-medium ${
                    action.details.referral.urgency === 'emergent' ? 'text-red-600' :
                    action.details.referral.urgency === 'urgent' ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>{action.details.referral.urgency}</span>
                </p>
              )}
            </div>
          );
        }
        break;
      
      case 'diagnostic_test':
        if ('test' in action.details) {
          return (
            <div className="space-y-1">
              <p className="font-medium text-gray-900">{action.details.test.name}</p>
              {action.details.test.type && (
                <p className="text-sm text-gray-600">Type: {action.details.test.type}</p>
              )}
              {action.details.test.urgency && (
                <p className="text-sm text-gray-600">
                  Urgency: <span className={`font-medium ${
                    action.details.test.urgency === 'stat' ? 'text-red-600' :
                    action.details.test.urgency === 'urgent' ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>{action.details.test.urgency}</span>
                </p>
              )}
            </div>
          );
        }
        break;
      
      default:
        return <p>{JSON.stringify(action.details)}</p>;
    }
  };

  if (actions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Detected Medical Actions</h3>
        <p className="text-gray-500 text-center py-8 italic">
          No medical actions detected yet...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Medical Actions</h3>

      <div className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              action.validated
                ? 'bg-green-50 border-green-400 shadow-sm'
                : 'bg-white border-yellow-400 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{getActionIcon(action.type)}</span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900 capitalize">
                      {action.type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {(action.confidence * 100).toFixed(0)}% confidence
                    </span>
                    {action.validated && (
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">
                        ✓ Validated
                      </span>
                    )}
                  </div>

                  <div className="text-gray-700">
                    {formatActionDetails(action)}
                  </div>
                </div>
              </div>

              {!action.validated && (
                <button
                  onClick={() => handleValidate(action.id)}
                  disabled={validating === action.id}
                  className="ml-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {validating === action.id ? 'Validating...' : 'Validate'}
                </button>
              )}
            </div>

            {action.webhook?.status && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Webhook:</span>
                  <span className={`font-medium ${
                    action.webhook.status === 'sent' ? 'text-green-600' :
                    action.webhook.status === 'failed' ? 'text-red-600' :
                    action.webhook.status === 'acknowledged' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {action.webhook.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}