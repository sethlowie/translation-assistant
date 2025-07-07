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

interface ConversationState {
  id: string | null;
  status: 'idle' | 'active' | 'ended';
  languages: {
    primary: 'en' | 'es';
    secondary: 'en' | 'es';
  };
  utterances: Utterance[];
  currentSpeaker: 'clinician' | 'patient' | null;
  isProcessing: boolean;
}

const initialState: ConversationState = {
  id: null,
  status: 'idle',
  languages: {
    primary: 'en',
    secondary: 'es',
  },
  utterances: [],
  currentSpeaker: null,
  isProcessing: false,
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
    },
    
    endConversation: (state) => {
      state.status = 'ended';
      state.currentSpeaker = null;
      state.isProcessing = false;
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
} = conversationSlice.actions;

export default conversationSlice.reducer;