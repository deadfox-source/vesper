import { create } from 'zustand';
import { SPREAD_LIBRARY } from './spreadLibrary';
import { generateOracleSynthesis, generateQuickSynthesis } from './synthesisEngine';
import type { SynthesisReport } from './synthesisEngine';
import type { TelemetryState } from '../utils/useRealTelemetry';
import { TAROT_DECK } from '../../constants/tarotDictionary';

export type VesperMood = 'idle' | 'focused' | 'agitated' | 'sleepy' | 'hyper';

export interface SierpinskiSeed {
  generation: number;
  complexity: number;
  lastSchumannPeak: number;
}

export interface BoardState {
  nodes: Record<number, string>;
  isSynthesisActive: boolean;
  isFullReportReady: boolean;
  synthesisReport: SynthesisReport | null;
  quickSynthesis: string;
  activeStep: number;
  activeSpreadId: string;
  gridInitialized: boolean;
  isGuidedMode: boolean;
  vesperMood: VesperMood;
  vesperEnergy: number;
  readingContext: { isSelf: boolean; subjectName: string; query?: string; env?: TelemetryState };
  cardNotes: Record<number, string>;
  cardPrompts: Record<number, string>;
  spokenNodes: Record<number, boolean>;
  introSpoken: boolean;
  isAwaitingSynthesisConfirm: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preSynthesisChat: any[];
  
  v9_social_logic_error: boolean;
  v9_shadow_integration_level: number;
  isDishonest: boolean;
  sierpinskiSeed: SierpinskiSeed;

  setSocialLogicError: (isError: boolean) => void;
  setDishonest: (dishonest: boolean) => void;
  updateShadowIntegration: (cardName: string) => void;
  updateSierpinskiComplexity: (delta: number) => void;
  setVesperMood: (mood: VesperMood) => void;
  setVesperEnergy: (energy: number | ((prev: number) => number)) => void;
  setReadingContext: (isSelf: boolean, subjectName: string, query?: string, env?: TelemetryState) => void;
  setCardNote: (nodeId: number, note: string) => void;
  setCardPrompt: (nodeId: number, prompt: string) => void;
  setNodeSpoken: (nodeId: number, spoken: boolean) => void;
  setIntroSpoken: (spoken: boolean) => void;
  setAwaitingSynthesisConfirm: (val: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPreSynthesisChat: (messages: any[]) => void;
  setCardToNode: (nodeId: number, cardName: string) => void;
  removeCardFromNode: (nodeId: number) => void;
  clearBoard: () => void;
  switchSpread: (spreadId: string) => void;
  initializeGrid: (spreadId: string) => void;
  setGuidedMode: (enabled: boolean) => void;
  drawNextGuidedCard: () => void;
  advanceGuidedStep: () => void;
  resetGrid: () => void;
  triggerFullReport: () => void;
  resetSynthesis: () => void;
  setQuickSynthesis: (text: string) => void;
  executeVesperAutoRead: () => Promise<void>;
}

const DEFAULT_READING_CONTEXT = { isSelf: true, subjectName: "Self" };
const SHADOW_CARDS = ["DEATH", "THE DEVIL", "THE TOWER", "THE MOON"];

export const useBoardStore = create<BoardState>((set) => ({
  nodes: {},
  isSynthesisActive: false,
  isFullReportReady: false,
  synthesisReport: null,
  quickSynthesis: "> AWAITING SYNC...",
  activeStep: 1,
  activeSpreadId: "GRID_MACRO_SYSTEM",
  gridInitialized: false,
  isGuidedMode: true,
  vesperMood: 'idle',
  vesperEnergy: 100,
  readingContext: DEFAULT_READING_CONTEXT,
  cardNotes: {},
  cardPrompts: {},
  spokenNodes: {},
  introSpoken: false,
  isAwaitingSynthesisConfirm: false,
  preSynthesisChat: [],

  v9_social_logic_error: false,
  v9_shadow_integration_level: 0.0,
  isDishonest: false,
  sierpinskiSeed: {
    generation: 1,
    complexity: 0.1,
    lastSchumannPeak: 7.83
  },


  setVesperMood: (mood) => set({ vesperMood: mood }),
  setVesperEnergy: (energy) => set((state) => ({ 
    vesperEnergy: typeof energy === 'function' ? Math.max(0, Math.min(100, energy(state.vesperEnergy))) : Math.max(0, Math.min(100, energy))
  })),

  setReadingContext: (isSelf, subjectName, query, env) => set({ readingContext: { isSelf, subjectName, query, env } }),

  setCardNote: (nodeId, note) => set((state) => {
    const isError = state.v9_social_logic_error;
    return { 
      cardNotes: { ...state.cardNotes, [nodeId]: note },
      v9_social_logic_error: isError
    };
  }),

  setCardPrompt: (nodeId, prompt) => set((state) => ({ 
    cardPrompts: { ...state.cardPrompts, [nodeId]: prompt } 
  })),

  setNodeSpoken: (nodeId, spoken) => set((state) => ({
    spokenNodes: { ...state.spokenNodes, [nodeId]: spoken }
  })),

  setIntroSpoken: (spoken) => set({ introSpoken: spoken }),
  setAwaitingSynthesisConfirm: (val) => set({ isAwaitingSynthesisConfirm: val }),
  setPreSynthesisChat: (messages) => set({ preSynthesisChat: messages }),

  setSocialLogicError: (isError) => set({ v9_social_logic_error: isError }),
  setDishonest: (dishonest) => set({ isDishonest: dishonest }),
  updateShadowIntegration: (cardName) => set((state) => {
    if (SHADOW_CARDS.includes(cardName.toUpperCase())) {
      return { v9_shadow_integration_level: state.v9_shadow_integration_level + 0.15 };
    }
    return state;
  }),
  updateSierpinskiComplexity: (delta) => set((state) => ({
    sierpinskiSeed: {
      ...state.sierpinskiSeed,
      complexity: Math.min(1.0, state.sierpinskiSeed.complexity + delta),
      generation: state.sierpinskiSeed.complexity + delta > 0.8 ? state.sierpinskiSeed.generation + 1 : state.sierpinskiSeed.generation
    }
  })),

  setCardToNode: (nodeId, cardName) => set((state) => {
    let shadowLevel = state.v9_shadow_integration_level;
    if (SHADOW_CARDS.includes(cardName.toUpperCase())) {
      shadowLevel += 0.15;
    }
    
    const newNodes = { ...state.nodes, [nodeId]: cardName };
    const currentSpread = SPREAD_LIBRARY[state.activeSpreadId];
    const isComplete = Object.keys(newNodes).length === currentSpread.nodes.length;

    let nextStep = currentSpread.nodes.length + 1;
    for (let i = 1; i <= currentSpread.nodes.length; i++) {
      if (!newNodes[i]) {
        nextStep = i;
        break;
      }
    }

    let report: SynthesisReport | null = null;
    if (isComplete) {
       report = generateOracleSynthesis(newNodes, state.activeSpreadId, state.readingContext);
    }

    return {
      nodes: newNodes,
      activeStep: nextStep,
      quickSynthesis: "[ SYNCING... ]",
      isFullReportReady: isComplete,
      synthesisReport: report,
      v9_shadow_integration_level: shadowLevel
    };
  }),

  removeCardFromNode: (nodeId) => set((state) => {
    const nextNodes = { ...state.nodes };
    delete nextNodes[nodeId];
    
    const currentSpread = SPREAD_LIBRARY[state.activeSpreadId];
    let nextStep = currentSpread.nodes.length + 1;
    for (let i = 1; i <= currentSpread.nodes.length; i++) {
      if (!nextNodes[i]) {
        nextStep = i;
        break;
      }
    }

    return { 
      nodes: nextNodes,
      activeStep: nextStep,
      quickSynthesis: generateQuickSynthesis(nextNodes),
      isSynthesisActive: false,
      isFullReportReady: false,
      synthesisReport: null
    };
  }),

  clearBoard: () => set({ 
    nodes: {}, 
    cardNotes: {}, 
    cardPrompts: {},
    spokenNodes: {},
    introSpoken: false,
    isAwaitingSynthesisConfirm: false,
    preSynthesisChat: [],
    activeStep: 1, 
    quickSynthesis: "> AWAITING SYNC...",
    isSynthesisActive: false, 
    isFullReportReady: false,
    synthesisReport: null,
    isGuidedMode: true,
    gridInitialized: false
  }),

  switchSpread: (spreadId) => set({
    activeSpreadId: spreadId,
    nodes: {},
    cardNotes: {},
    cardPrompts: {},
    spokenNodes: {},
    introSpoken: false,
    isAwaitingSynthesisConfirm: false,
    preSynthesisChat: [],
    activeStep: 1,
    isSynthesisActive: false,
    isFullReportReady: false,
    synthesisReport: null
  }),

  initializeGrid: (spreadId) => set({
    activeSpreadId: spreadId,
    gridInitialized: true,
    nodes: {},
    cardNotes: {},
    cardPrompts: {},
    spokenNodes: {},
    introSpoken: false,
    isAwaitingSynthesisConfirm: false,
    preSynthesisChat: [],
    activeStep: 1,
    quickSynthesis: "> AWAITING SYNC...",
    isSynthesisActive: false,
    isFullReportReady: false,
    synthesisReport: null
  }),

  setGuidedMode: (enabled) => set({ isGuidedMode: enabled }),

  drawNextGuidedCard: () => set((state) => {
    const currentSpread = SPREAD_LIBRARY[state.activeSpreadId];
    if (state.activeStep > currentSpread.nodes.length) return state; // Already full

    const usedCards = Object.values(state.nodes);
    const availableCards = TAROT_DECK.map(c => c.name).filter(name => !usedCards.includes(name));
    
    if (availableCards.length === 0) return state;
    
    const rIndex = Math.floor(Math.random() * availableCards.length);
    const newCard = availableCards[rIndex];
    
    let shadowLevel = state.v9_shadow_integration_level;
    if (SHADOW_CARDS.includes(newCard.toUpperCase())) {
      shadowLevel += 0.15;
    }
    
    const newNodes = { ...state.nodes, [state.activeStep]: newCard };
    const isComplete = Object.keys(newNodes).length === currentSpread.nodes.length;
    
    // We do NOT increment activeStep here yet, because the user hasn't 
    // answered the prompt. We just assign the card to the node.
    // Actually, wait! The user draws the card *for* the current step. 
    // The current step is focused. Once they submit their note, we increment the step.
    
    return {
      nodes: newNodes,
      quickSynthesis: `[ NODE ${state.activeStep} READY. RECORD LOG. ]`,
      isFullReportReady: isComplete,
      v9_shadow_integration_level: shadowLevel
    };
  }),

  advanceGuidedStep: () => set((state) => {
    const currentSpread = SPREAD_LIBRARY[state.activeSpreadId];
    let nextStep = currentSpread.nodes.length + 1;
    
    // Find next empty node
    for (let i = 1; i <= currentSpread.nodes.length; i++) {
      if (!state.nodes[i]) {
        nextStep = i;
        break;
      }
    }
    
    let report = state.synthesisReport;
    const isComplete = nextStep > currentSpread.nodes.length;
    
    if (isComplete && !report) {
       report = generateOracleSynthesis(state.nodes, state.activeSpreadId, state.readingContext);
    }
    
    return {
      activeStep: nextStep,
      quickSynthesis: isComplete ? "[ READY FOR REPORT. ]" : `[ DRAW NEXT: NODE ${nextStep} ]`,
      isFullReportReady: isComplete,
      synthesisReport: report
    };
  }),

  resetGrid: () => set({
    gridInitialized: false,
    nodes: {},
    cardNotes: {},
    cardPrompts: {},
    spokenNodes: {},
    introSpoken: false,
    isAwaitingSynthesisConfirm: false,
    preSynthesisChat: [],
    activeStep: 1,
    quickSynthesis: "> AWAITING SYNC...",
    isSynthesisActive: false,
    isFullReportReady: false,
    synthesisReport: null,
    isGuidedMode: true
  }),

  triggerFullReport: () => set((state) => {
    let report = state.synthesisReport;
    if (!report && Object.keys(state.nodes).length > 0) {
       report = generateOracleSynthesis(state.nodes, state.activeSpreadId, state.readingContext);
    }
    return { isSynthesisActive: true, synthesisReport: report };
  }),

  resetSynthesis: () => set({ isSynthesisActive: false, isAwaitingSynthesisConfirm: false, synthesisReport: null }),

  setQuickSynthesis: (text) => set({ quickSynthesis: text }),

  executeVesperAutoRead: async () => {
    const state = useBoardStore.getState();
    const spreadId = state.activeSpreadId;
    set({
      quickSynthesis: "[ AUTO-DRAWING... ]",
    });

    try {
      const { executeVesperAutoRead: vesperEngine } = await import('../Network/geminiService');
      const result = await vesperEngine(spreadId);
      
      const newNodes: Record<number, string> = {};
      result.drawnCards.forEach((card, idx) => {
        newNodes[idx + 1] = card;
      });

      const report = generateOracleSynthesis(newNodes, spreadId, state.readingContext);
      
      // Override the report text with Vesper's LLM report
      report.triadAnalysis = result.vReport;
      report.gridSummary = "[ VESPER LLM SYNTHESIS IN OVERRIDE MODE ]";

      set({
        nodes: newNodes,
        activeStep: result.drawnCards.length + 1,
        isFullReportReady: true,
        synthesisReport: report,
        isSynthesisActive: true,
        quickSynthesis: "> SYNC COMPLETE."
      });
    } catch (e) {
      console.error(e);
      set({ quickSynthesis: "[ ERROR: FAILED TO AUTO-POPULATE GRID ]" });
    }
  }
}));
