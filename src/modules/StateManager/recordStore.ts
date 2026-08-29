import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VesperRecord {
  id: string;
  timestamp: string;
  subjectName: string;
  spreadId: string;
  spreadName: string;
  nodes: Record<number, string>;
  synthesis: string;
  cardNotes?: Record<number, string>;
  query?: string;
}

interface RecordState {
  savedRecords: VesperRecord[];
  addRecord: (record: VesperRecord) => void;
  deleteRecord: (id: string) => void;
  clearAll: () => void;
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set) => ({
      savedRecords: [],
      addRecord: (record) => set((state) => ({
        savedRecords: [record, ...state.savedRecords]
      })),
      deleteRecord: (id) => set((state) => ({
        savedRecords: state.savedRecords.filter(r => r.id !== id)
      })),
      clearAll: () => set({ savedRecords: [] }),
    }),
    {
      name: 'vesper-records-storage', // Persists in LocalStorage
      version: 1,
      migrate: (persistedState: any) => persistedState
    }
  )
);
