'use client';

import { useState } from 'react';
import { useAppSelector } from '@/lib/client/store/hooks';

interface SummaryData {
  content: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    assessmentAndPlan: string;
    medicationsDiscussed: string[];
    testsOrdered: string[];
    followUpInstructions: string;
  };
  extractedData: {
    symptoms: Array<{
      name: string;
      duration?: string;
      severity?: string;
    }>;
    vitalSigns?: {
      bloodPressure?: string;
      heartRate?: string;
      temperature?: string;
      weight?: string;
    };
    diagnoses: Array<{
      description: string;
      icd10Code?: string;
      confidence: number;
    }>;
  };
  generatedAt: string;
}

export function ConversationSummary() {
  const conversationId = useAppSelector((state) => state.conversation.id);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    if (!conversationId) {
      setError('No active conversation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/summary`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (convId: string) => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch(`/api/conversations/${convId}/summary`);
      
      if (response.status === 404) {
        // No summary exists yet
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  // Load summary for selected conversation
  const handleLoadConversation = (conversationId: string) => {
    loadSummary(conversationId);
  };

  // Expose this method for parent components
  if (typeof window !== 'undefined') {
    (window as { loadConversationSummary?: (id: string) => void }).loadConversationSummary = handleLoadConversation;
  }

  if (!conversationId && !summary) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Summary</h3>
        <p className="text-gray-500 text-center py-8">
          Start or select a conversation to generate a summary
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Clinical Summary</h3>
        {conversationId && !summary && (
          <button
            onClick={generateSummary}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Summary'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && !summary && (
        <div className="py-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            <span>Generating summary...</span>
          </div>
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* Chief Complaint */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Chief Complaint</h4>
            <p className="text-gray-700">{summary.content.chiefComplaint}</p>
          </div>

          {/* History of Present Illness */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">History of Present Illness</h4>
            <p className="text-gray-700">{summary.content.historyOfPresentIllness}</p>
          </div>

          {/* Assessment and Plan */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Assessment and Plan</h4>
            <p className="text-gray-700">{summary.content.assessmentAndPlan}</p>
          </div>

          {/* Medications */}
          {summary.content.medicationsDiscussed.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Medications Discussed</h4>
              <ul className="list-disc list-inside space-y-1">
                {summary.content.medicationsDiscussed.map((med, index) => (
                  <li key={index} className="text-gray-700">{med}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tests Ordered */}
          {summary.content.testsOrdered.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Tests Ordered</h4>
              <ul className="list-disc list-inside space-y-1">
                {summary.content.testsOrdered.map((test, index) => (
                  <li key={index} className="text-gray-700">{test}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-up Instructions */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Follow-up Instructions</h4>
            <p className="text-gray-700">{summary.content.followUpInstructions}</p>
          </div>

          {/* Extracted Data */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Extracted Clinical Data</h4>
            
            {/* Symptoms */}
            {summary.extractedData.symptoms.length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-1">Symptoms</h5>
                <div className="space-y-1">
                  {summary.extractedData.symptoms.map((symptom, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {symptom.name}
                      {symptom.duration && ` - Duration: ${symptom.duration}`}
                      {symptom.severity && ` - Severity: ${symptom.severity}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vital Signs */}
            {summary.extractedData.vitalSigns && Object.keys(summary.extractedData.vitalSigns).length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-1">Vital Signs</h5>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  {summary.extractedData.vitalSigns.bloodPressure && (
                    <div>BP: {summary.extractedData.vitalSigns.bloodPressure}</div>
                  )}
                  {summary.extractedData.vitalSigns.heartRate && (
                    <div>HR: {summary.extractedData.vitalSigns.heartRate}</div>
                  )}
                  {summary.extractedData.vitalSigns.temperature && (
                    <div>Temp: {summary.extractedData.vitalSigns.temperature}</div>
                  )}
                  {summary.extractedData.vitalSigns.weight && (
                    <div>Weight: {summary.extractedData.vitalSigns.weight}</div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnoses */}
            {summary.extractedData.diagnoses.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Potential Diagnoses</h5>
                <div className="space-y-1">
                  {summary.extractedData.diagnoses.map((diagnosis, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {diagnosis.description}
                      {diagnosis.icd10Code && ` (ICD-10: ${diagnosis.icd10Code})`}
                      <span className="text-xs text-gray-500 ml-1">
                        - {(diagnosis.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generated timestamp */}
          <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
            Generated: {new Date(summary.generatedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}