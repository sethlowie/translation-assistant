'use client';

import { useState, useEffect } from 'react';

export function WebhookConfig() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Load saved webhook configuration
    const savedUrl = localStorage.getItem('webhookUrl') || '';
    const savedEnabled = localStorage.getItem('webhookEnabled') === 'true';
    
    setWebhookUrl(savedUrl);
    setIsEnabled(savedEnabled);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    // Save to localStorage
    localStorage.setItem('webhookUrl', webhookUrl);
    localStorage.setItem('webhookEnabled', String(isEnabled));
    
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  const handleTest = async () => {
    if (!webhookUrl) return;
    
    setTestStatus('testing');
    
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webhookUrl,
          testPayload: {
            event: 'medical.action.test',
            action: {
              id: 'test-123',
              type: 'prescription',
              details: {
                medication: {
                  name: 'Test Medication',
                  dosage: '100mg',
                  frequency: 'twice daily'
                }
              },
              confidence: 0.95
            },
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (response.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
      setTestStatus('error');
    }
    
    // Reset status after 3 seconds
    setTimeout(() => {
      setTestStatus('idle');
    }, 3000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Webhook Configuration</h3>
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          aria-label="Toggle webhooks"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 mb-1">
            Webhook URL
          </label>
          <div className="flex gap-2">
            <input
              id="webhook-url"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://webhook.site/your-unique-url"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isEnabled}
            />
            <button
              onClick={handleSave}
              disabled={!isEnabled || isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Get a free webhook URL at{' '}
            <a 
              href="https://webhook.site" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              webhook.site
            </a>
          </p>
        </div>

        {webhookUrl && isEnabled && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                testStatus === 'success' ? 'bg-green-600 text-white' :
                testStatus === 'error' ? 'bg-red-600 text-white' :
                testStatus === 'testing' ? 'bg-gray-400 text-white' :
                'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:cursor-not-allowed`}
            >
              {testStatus === 'testing' ? 'Testing...' :
               testStatus === 'success' ? '✓ Test Successful!' :
               testStatus === 'error' ? '✗ Test Failed' :
               'Test Webhook'}
            </button>
            
            <div className="mt-3 text-xs text-gray-600">
              <p className="font-medium mb-1">Webhook Events:</p>
              <ul className="space-y-1 text-gray-500">
                <li>• Prescription validated</li>
                <li>• Lab order confirmed</li>
                <li>• Referral processed</li>
                <li>• Follow-up scheduled</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}