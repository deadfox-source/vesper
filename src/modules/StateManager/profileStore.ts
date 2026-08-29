import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface JournalEntry {
  id: string;
  timestamp: string;
  drawnCardName: string;
  vesperPrompt: string;
  userEntry: string;
}

export interface SavedConversation {
  id: string;
  timestamp: string;
  title: string;
  chatLog: { role: 'user' | 'vesper', text: string }[];
}

interface ProfileState {
  journalEntries: JournalEntry[];
  savedConversations: SavedConversation[];
  addJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
  clearJournal: () => void;
  addSavedConversation: (conversation: SavedConversation) => void;
  updateSavedConversation: (id: string, conversationUpdate: Partial<SavedConversation>) => void;
  deleteSavedConversation: (id: string) => void;
  clearSavedConversations: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      journalEntries: [],
      savedConversations: [],
      addJournalEntry: (entry) => set((state) => ({
        journalEntries: [entry, ...state.journalEntries]
      })),
      deleteJournalEntry: (id) => set((state) => ({
        journalEntries: state.journalEntries.filter(e => e.id !== id)
      })),
      clearJournal: () => set({ journalEntries: [] }),
      addSavedConversation: (conversation) => set((state) => ({
        savedConversations: [conversation, ...state.savedConversations]
      })),
      updateSavedConversation: (id, conversationUpdate) => set((state) => ({
        savedConversations: state.savedConversations.map(c => c.id === id ? { ...c, ...conversationUpdate } : c)
      })),
      deleteSavedConversation: (id) => set((state) => ({
        savedConversations: state.savedConversations.filter(c => c.id !== id)
      })),
      clearSavedConversations: () => set({ savedConversations: [] }),
    }),
    {
      name: 'vesper-profile-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          // Migrate savedInsights to savedConversations
          if (persistedState.savedInsights && !persistedState.savedConversations) {
            persistedState.savedConversations = persistedState.savedInsights;
            delete persistedState.savedInsights;
          }
        }
        return persistedState;
      }
    }
  )
);
