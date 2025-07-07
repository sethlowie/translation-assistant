import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Utterance {
  id: string;
  role: 'clinician' | 'patient';
  originalText: string;
  translatedText?: string;
  timestamp: string;
  language: 'en' | 'es';
  sequenceNumber: number;
}

// Action detail types based on schema
interface PrescriptionDetails {
  medication: {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    rxnormCode?: string;
  };
}

interface LabOrderDetails {
  labTest: {
    name: string;
    loincCode?: string;
    urgency?: string;
  };
}

interface ReferralDetails {
  referral: {
    specialty: string;
    reason: string;
    urgency: string;
  };
}

interface FollowUpDetails {
  followUp: {
    timeframe: string;
    reason: string;
  };
}

interface DiagnosticTestDetails {
  test: {
    name: string;
    type?: string;
    urgency?: string;
  };
}

type ActionDetails = PrescriptionDetails | LabOrderDetails | ReferralDetails | FollowUpDetails | DiagnosticTestDetails;

export interface Action {
  id: string;
  type: 'prescription' | 'lab_order' | 'referral' | 'follow_up' | 'diagnostic_test';
  details: ActionDetails;
  confidence: number;
  validated: boolean;
  webhook?: {
    status: 'pending' | 'sent' | 'failed' | 'acknowledged';
  };
}

interface ConversationState {
  id: string | null;
  status: 'idle' | 'active' | 'ended';
  languages: {
    primary: 'en' | 'es';
    secondary: 'en' | 'es';
  };
  utterances: Utterance[];
  actions: Action[];
  currentSpeaker: 'clinician' | 'patient' | null;
  isProcessing: boolean;
  isActive: boolean;
}

const initialState: ConversationState = {
  id: null,
  status: 'idle',
  languages: {
    primary: 'en',
    secondary: 'es',
  },
  utterances: [],
  actions: [],
  currentSpeaker: null,
  isProcessing: false,
  isActive: false,
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    startConversation: (state, action: PayloadAction<{ id: string; languages: { primary: 'en' | 'es'; secondary: 'en' | 'es' } }>) => {
      state.id = action.payload.id;
      state.status = 'active';
      state.languages = action.payload.languages;
      state.utterances = [];
      state.actions = [];
      state.isActive = true;
    },
    
    endConversation: (state) => {
      state.status = 'ended';
      state.currentSpeaker = null;
      state.isProcessing = false;
      state.isActive = false;
    },
    
    resetConversation: () => initialState,
    
    addUtterance: (state, action: PayloadAction<Omit<Utterance, 'id' | 'sequenceNumber'>>) => {
      const utterance: Utterance = {
        ...action.payload,
        id: `utterance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sequenceNumber: state.utterances.length + 1,
      };
      state.utterances.push(utterance);
    },
    
    updateUtteranceTranslation: (state, action: PayloadAction<{ id: string; translatedText: string }>) => {
      const utterance = state.utterances.find(u => u.id === action.payload.id);
      if (utterance) {
        utterance.translatedText = action.payload.translatedText;
      }
    },
    
    switchLanguages: (state) => {
      const temp = state.languages.primary;
      state.languages.primary = state.languages.secondary;
      state.languages.secondary = temp;
    },
    
    setCurrentSpeaker: (state, action: PayloadAction<'clinician' | 'patient' | null>) => {
      state.currentSpeaker = action.payload;
    },
    
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    
    addAction: (state, action: PayloadAction<Action>) => {
      state.actions.push(action.payload);
    },
    
    updateActionValidation: (state, action: PayloadAction<{ id: string; validated: boolean }>) => {
      const actionItem = state.actions.find(a => a.id === action.payload.id);
      if (actionItem) {
        actionItem.validated = action.payload.validated;
      }
    },
    
    updateActionWebhookStatus: (state, action: PayloadAction<{ id: string; status: 'pending' | 'sent' | 'failed' | 'acknowledged' }>) => {
      const actionItem = state.actions.find(a => a.id === action.payload.id);
      if (actionItem) {
        actionItem.webhook = { status: action.payload.status };
      }
    },
    
    loadConversation: (
      state,
      action: PayloadAction<{
        id: string;
        languages: ConversationState['languages'];
        utterances: Utterance[];
        actions: Action[];
      }>
    ) => {
      state.id = action.payload.id;
      state.languages = action.payload.languages || { primary: 'en', secondary: 'es' };
      state.utterances = action.payload.utterances;
      state.actions = action.payload.actions;
      state.status = 'ended'; // Past conversations are ended
      state.isActive = false;
      state.isProcessing = false;
      state.currentSpeaker = null;
    },
  },
});

export const {
  startConversation,
  endConversation,
  resetConversation,
  addUtterance,
  updateUtteranceTranslation,
  switchLanguages,
  setCurrentSpeaker,
  setProcessing,
  addAction,
  updateActionValidation,
  updateActionWebhookStatus,
  loadConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;