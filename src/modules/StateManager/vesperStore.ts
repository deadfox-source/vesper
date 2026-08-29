import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VesperMode = 'FULL' | 'LITE';

export interface Message {
  role: 'user' | 'vesper';
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestion?: any;
  emotion?: 'positive' | 'negative' | 'neutral' | 'embarrassment' | 'aggressive';
  supportMode?: boolean;
  isTemp?: boolean;
  timestamp?: string;
  options?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  synthesisData?: any;
}

interface VesperState {
  mode: VesperMode;
  micEnabled: boolean;
  cameraEnabled: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  audioOutputEnabled: boolean;
  textOutputEnabled: boolean;
  readingOnboardingState: 'idle' | 'asking_intent';
  activeSpeechSentence: string | null;
  setMode: (mode: VesperMode) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setListening: (isListening: boolean) => void;
  toggleAudioOutput: () => void;
  toggleTextOutput: () => void;
  setReadingOnboardingState: (state: 'idle' | 'asking_intent') => void;
  setActiveSpeechSentence: (sentence: string | null) => void;
  messages: Message[];
  setMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  clearMessages: () => void;
  readingMessages: Message[];
  setReadingMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  clearReadingMessages: () => void;
}

export const useVesperStore = create<VesperState>()(
  persist(
    (set) => ({
      mode: 'LITE', // Default to Lite
      micEnabled: false,
      cameraEnabled: false,
      isSpeaking: false,
      isListening: false,
      audioOutputEnabled: true,
      textOutputEnabled: true,
      readingOnboardingState: 'idle',
      activeSpeechSentence: null,
      setMode: (mode) => set({ mode }),
      toggleMic: () => set((state) => ({ micEnabled: !state.micEnabled })),
      toggleCamera: () => set((state) => ({ cameraEnabled: !state.cameraEnabled })),
      setSpeaking: (isSpeaking) => set({ isSpeaking }),
      setListening: (isListening) => set({ isListening }),
      toggleAudioOutput: () => set((state) => ({ audioOutputEnabled: !state.audioOutputEnabled })),
      toggleTextOutput: () => set((state) => ({ textOutputEnabled: !state.textOutputEnabled })),
      setReadingOnboardingState: (state) => set({ readingOnboardingState: state }),
      setActiveSpeechSentence: (sentence) => set({ activeSpeechSentence: sentence }),
      messages: [
        { 
          role: 'vesper', 
          text: '[ ESTABLISHING UPLINK... ]',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          options: []
        }
      ],
      setMessages: (updater) => set((state) => ({ 
        messages: typeof updater === 'function' ? updater(state.messages) : updater 
      })),
      clearMessages: () => set({ messages: [
        { 
          role: 'vesper', 
          text: '[ ESTABLISHING UPLINK... ]',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          options: []
        }
      ] }),
      readingMessages: [
        { 
          role: 'vesper', 
          text: '[ READING PROTOCOL INITIALIZED ] AWAITING DATA...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        }
      ],
      setReadingMessages: (updater) => set((state) => ({ 
        readingMessages: typeof updater === 'function' ? updater(state.readingMessages) : updater 
      })),
      clearReadingMessages: () => set({ readingMessages: [
        { 
          role: 'vesper', 
          text: '[ READING PROTOCOL INITIALIZED ] AWAITING DATA...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        }
      ] }),
    }),
    {
      name: 'vesper-chat-storage',
      version: 1, // Bump version to clear out old non-partialized state (like broken messages)
      partialize: (state) => ({
        audioOutputEnabled: state.audioOutputEnabled,
        textOutputEnabled: state.textOutputEnabled,
      }),
    }
  )
);
