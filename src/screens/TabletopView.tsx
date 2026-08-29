import { useState, useEffect, useRef } from 'react';
import { useBoardStore } from '../modules/StateManager/boardState';
import { NodeFocusModal } from '../components/ui/NodeFocusModal';
import { ReadingConfigModal } from '../components/ui/ReadingConfigModal';
import { SPREAD_LIBRARY } from '../modules/StateManager/spreadLibrary';
import { SpreadRenderer } from '../components/ui/SpreadRenderer';
import { VesperHeader } from '../components/ui/VesperHeader';
import { SynthesisTerminal } from '../components/ui/SynthesisTerminal';
import { useRealTelemetry } from '../modules/utils/useRealTelemetry';
import { oscRouter } from '../modules/Network/oscRouter';
import { Plus, Layout, ChevronUp, ChevronDown, Network, Crosshair, Activity, Terminal, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { ScrambleText } from '../components/ui/ScrambleText';
import { TerminalFrame, TerminalMessageList, type VesperMessage } from '../components/ui/VesperTerminal';

// ─── Spread Guide Data ──────────────────────────────────────────────

const SPREAD_GUIDE: Record<string, { icon: typeof Network; tagline: string; nodeCount: number; description: string }> = {
  GRID_MACRO_SYSTEM: {
    icon: Network,
    tagline: 'FULL SYSTEM SCAN',
    nodeCount: 10,
    description: 'A comprehensive 10-node mapping. Maps across intention, resources, conflict, emotion, logic, and resolution. Best for deep, multi-layered inquiries that require a holistic view.'
  },
  GRID_INFILTRATION: {
    icon: Crosshair,
    tagline: 'QUICK INQUIRY',
    nodeCount: 3,
    description: 'A focused 3-node spread. Identify your current state, confront the primary obstacle, and define action on the objective. Best for a single direct question that demands immediate clarity.'
  },
  GRID_EXFILTRATION: {
    icon: Activity,
    tagline: 'CHALLENGE RESOLUTION',
    nodeCount: 5,
    description: 'A 5-node pathfinding spread. Assess the situation, uncover hidden factors, clear the path forward, find external support, and define the resolution. Best for navigating difficult situations.'
  }
};

// ─── Spread Selection Guide Screen ──────────────────────────────────

interface SpreadSelectorProps {
  onConfirm: (spreadId: string) => void;
}

const SpreadSelectorGuide: React.FC<SpreadSelectorProps> = ({ onConfirm }) => {
  const [selectedSpread, setSelectedSpread] = useState<string | null>('GRID_INFILTRATION');
  const [customQuery, setCustomQuery] = useState('');
  const [highlightInput, setHighlightInput] = useState(false);
  const setReadingContext = useBoardStore((state) => state.setReadingContext);
  const telemetry = useRealTelemetry();

  const handleDeploy = () => {
    if (!selectedSpread) return;
    setReadingContext(true, 'Self', customQuery, telemetry);
    onConfirm(selectedSpread);
  };

  const handleTemplateClick = (id: string) => {
    setSelectedSpread(id);
    if (!customQuery.trim()) {
      setHighlightInput(true);
      setTimeout(() => setHighlightInput(false), 800);
      document.getElementById('intent-query-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const spreadEntries = Object.entries(SPREAD_LIBRARY).sort((a, b) => a[1].nodes.length - b[1].nodes.length);

  return (
    <div className="material-background" style={{ flex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflowX: 'hidden' }}>

      <VesperHeader 
        title="MISSION SELECT"
        accentColor="var(--eva-cyan)"
        telemetryData={[
          { icon: <Layout size={14} />, label: 'STAT', value: 'STANDBY', scramble: true }
        ]}
        actions={undefined}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '25px', position: 'relative', zIndex: 10 }} className="custom-scrollbar">


        {/* 2. INTENTION / QUERY (SECOND) */}
        <div style={{ position: 'relative' }}>
          <h2 style={{ 
            fontSize: '0.8rem', 
            color: 'var(--void-black)', 
            background: 'var(--eva-cyan)', 
            padding: '4px 10px', 
            marginBottom: '15px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontWeight: 'bold' 
          }}>
            <span>&gt; <ScrambleText text="INTENT QUERY" duration={1.5} /></span>
            <span style={{ opacity: 0.8 }}>[ REQUIRED ]</span>
          </h2>
          
          <div id="intent-query-container" style={{ 
            display: 'flex', 
            borderBottom: `1px solid ${highlightInput ? 'var(--warning-amber)' : 'var(--magi-orange)'}`, 
            background: highlightInput ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 102, 0, 0.03)', 
            padding: '12px 10px', 
            alignItems: 'center', 
            gap: '8px',
            transition: 'all 0.3s ease'
          }}>
            <Terminal size={15} style={{ color: highlightInput ? 'var(--warning-amber)' : 'var(--magi-orange)', flexShrink: 0, opacity: 0.7, transition: 'color 0.3s ease' }} />
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              {!customQuery && (
                <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'rgba(255, 102, 0, 0.45)', fontFamily: 'monospace', fontSize: '15px' }}>
                  <span className="terminal-orange-cursor" />
                  <span>Enter your topic of inquiry</span>
                </div>
              )}
              <input 
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--magi-orange)',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  outline: 'none',
                  paddingLeft: '8px',
                  caretColor: 'var(--magi-orange)'
                }}
              />
            </div>
          </div>
        </div>

        {/* 3. TEMPLATES (THIRD) */}
        <div style={{ position: 'relative' }}>
          <h2 style={{ 
            fontSize: '0.8rem', 
            color: 'var(--void-black)', 
            background: 'var(--eva-cyan)', 
            padding: '4px 10px', 
            marginBottom: '20px', 
            display: 'flex', 
            justifyContent: 'space-between',
            fontWeight: 'bold' 
          }}>
            <span>&gt; <ScrambleText text="INITIALIZATION TEMPLATES" duration={2} /></span>
            <span style={{ opacity: 0.8 }}>[ AVAIL: {spreadEntries.length} ]</span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {spreadEntries.map(([id, spread], idx) => {
              const guide = SPREAD_GUIDE[id];
              const isSelected = selectedSpread === id;
              const IconComponent = guide?.icon || Network;

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleTemplateClick(id)}
                  className={`material-terminal template-card ${isSelected ? 'selected' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '15px',
                    border: '2px solid var(--eva-cyan)',
                    background: isSelected ? 'var(--eva-cyan)' : 'var(--void-black)',
                    position: 'relative',
                    transition: 'none'
                  }}
                >
                  <div className="template-content-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IconComponent size={14} style={{ color: isSelected ? 'var(--void-black)' : 'var(--eva-cyan)' }} />
                        <span style={{ 
                          color: isSelected ? 'var(--void-black)' : 'var(--magi-orange)', 
                          fontWeight: 'bold', 
                          fontSize: '0.7rem', 
                          letterSpacing: '0.5px' 
                        }}>
                          {spread.name.toUpperCase()}
                          {id === 'GRID_INFILTRATION' && <span style={{ marginLeft: '8px', color: isSelected ? 'var(--void-black)' : 'var(--eva-cyan)', fontSize: '0.55rem', border: '1px solid currentColor', padding: '2px 4px', whiteSpace: 'nowrap' }}>[ RECOMMENDED FOR FIRST DEPLOYMENT ]</span>}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: '0.6rem', 
                        padding: '2px 8px', 
                        border: `1px solid ${isSelected ? 'var(--void-black)' : 'var(--magi-orange)'}`,
                        color: isSelected ? 'var(--void-black)' : 'var(--magi-orange)',
                        fontWeight: 'bold'
                      }}>
                        {guide?.nodeCount || spread.nodes.length} NODES
                      </span>
                    </div>



                    <p style={{ 
                      color: isSelected ? 'var(--void-black)' : 'rgba(230, 237, 243, 0.7)', 
                      fontSize: '0.75rem', 
                      lineHeight: '1.4', 
                      margin: 0,
                      fontFamily: 'monospace'
                    }}>
                      {guide?.description || spread.nodes.map(n => n.title).join(' → ')}
                    </p>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ 
                            marginTop: '12px', 
                            paddingTop: '12px', 
                            borderTop: '1px dashed rgba(0, 0, 0, 0.2)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px'
                          }}>
                            {spread.nodes.map((node) => (
                              <span 
                                key={node.id}
                                style={{
                                  fontSize: '0.55rem',
                                  padding: '2px 6px',
                                  border: '1px solid rgba(0, 0, 0, 0.15)',
                                  color: 'var(--void-black)',
                                  background: 'rgba(0, 0, 0, 0.05)',
                                  fontWeight: 'bold'
                                }}
                              >
                                {node.id}. {node.title}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Deploy Button Bottom Bar */}
      <AnimatePresence>
        {selectedSpread && (
          <motion.div 
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ 
              padding: '15px 20px', 
              borderTop: '2px solid var(--magi-orange)', 
              background: 'rgba(5, 7, 10, 0.98)', 
              backdropFilter: 'blur(10px)', 
              zIndex: 100, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px' 
            }}
          >
            <motion.button 
              onClick={handleDeploy}
              disabled={!customQuery.trim()}
              className="primary-btn"
              style={{ 
                width: '100%',
                padding: '16px', 
                fontSize: '0.95rem',
                cursor: !customQuery.trim() ? 'not-allowed' : 'pointer',
                letterSpacing: '4px',
                fontWeight: 'bold',
                backgroundColor: !customQuery.trim() ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 240, 255, 0.1)',
                border: `2px solid ${!customQuery.trim() ? 'rgba(0, 240, 255, 0.2)' : 'var(--eva-cyan)'}`,
                color: !customQuery.trim() ? 'rgba(0, 240, 255, 0.3)' : 'var(--eva-cyan)',
                boxShadow: !customQuery.trim() ? 'none' : '0 0 25px rgba(0, 240, 255, 0.15)',
                opacity: !customQuery.trim() ? 0.5 : 1,
                transition: 'none'
              }}
              whileHover={!customQuery.trim() ? undefined : { backgroundColor: 'var(--eva-cyan)', color: 'var(--void-black)' }}
              whileTap={!customQuery.trim() ? undefined : { scale: 0.98 }}
            >
              [ INITIATE SCAN ]
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .template-card:hover { 
          background-color: var(--eva-cyan) !important;
          border-color: rgba(0, 0, 0, 0.3) !important;
        }
        .template-card.selected { 
          background-color: var(--eva-cyan) !important;
          border-color: rgba(0, 0, 0, 0.3) !important;
        }
        .template-card:hover *,
        .template-card:hover svg,
        .template-card.selected *,
        .template-card.selected svg { 
          color: var(--void-black) !important; 
          stroke: var(--void-black) !important;
          border-color: rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

// ─── Active Grid View ───────────────────────────────────────────────
// NOTE: Mic/Terminal/useVesperStore/interactWithVesper/speakVesperText imported here
// because they are only used in this sub-component.
import { Mic, Send } from 'lucide-react';
import { useVesperStore } from '../modules/StateManager/vesperStore';
import { analyzeCardReflection } from '../modules/Network/geminiService';
import { speakVesperTextAndWait, clearSpeechQueue } from '../modules/utils/vesperSpeech';


const ActiveGridView = () => {
  const boardNodes    = useBoardStore((state) => state.nodes);
  const activeStep    = useBoardStore((state) => state.activeStep);
  const activeSpreadId = useBoardStore((state) => state.activeSpreadId);
  const isSynthesisActive = useBoardStore((state) => state.isSynthesisActive);
  const resetGrid         = useBoardStore((state) => state.resetGrid);
  const isGuidedMode      = useBoardStore((state) => state.isGuidedMode);
  const isAwaitingSynthesisConfirm = useBoardStore((state) => state.isAwaitingSynthesisConfirm);
  const triggerFullReport = useBoardStore((state) => state.triggerFullReport);
  const setAwaitingSynthesisConfirm = useBoardStore((state) => state.setAwaitingSynthesisConfirm);

  const { isListening, setListening, textOutputEnabled, readingMessages, setReadingMessages } = useVesperStore();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVesperSpeaking, setIsVesperSpeaking] = useState(false);
  const [isAwaitingTap, setIsAwaitingTap] = useState(false); // user must tap the node to draw
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusedNode, setFocusedNode] = useState<number | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isFeedExpanded, setIsFeedExpanded] = useState(true);
  const [is3DMode] = useState(true);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [readingMessages, isTyping]);

  // Clear speech on unmount
  useEffect(() => {
    return () => clearSpeechQueue();
  }, []);

  // Speech recognition init
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) setInputValue(prev => (prev + ' ' + final).trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, [setListening]);

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try { recognitionRef.current.start(); setListening(true); }
      catch (e) { console.error('Recognition start failed', e); }
    }
  };



  // ── AUTO-START: intro speech → prompt user to tap the first node ──────
  useEffect(() => {
    if (Object.keys(boardNodes).length > 0) return;

    let cancelled = false;

    // Helper: true if the user has already drawn a card (early tap)
    const hasDrawnEarly = () => Object.keys(useBoardStore.getState().nodes).length > 0;

    const run = async () => {
      const store = useBoardStore.getState();
      if (store.introSpoken) {
        setIsAwaitingTap(true);
        return;
      }

      // Step 1: 2.5s — let the grid render
      await new Promise(r => setTimeout(r, 2500));
      if (cancelled || hasDrawnEarly()) return;

      // Step 2: Vesper speaks the opening and asks the user to tap the first node
      const introLine = isGuidedMode 
        ? 'Tap the illuminated node to collapse the probability matrix and draw your first card.'
        : 'Tap the illuminated node to focus your intent and select your first card.';

      setReadingMessages([{ role: 'vesper', text: introLine, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }]);
      store.setIntroSpoken(true);
      await speakVesperTextAndWait(introLine);
      if (cancelled || hasDrawnEarly()) return;

      // Step 3: 600ms beat, then activate the tap prompt on the node
      await new Promise(r => setTimeout(r, 600));
      if (cancelled || hasDrawnEarly()) return;
      setIsAwaitingTap(true);
    };

    run();

    return () => {
      cancelled = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const timeoutId = autoDismissRef.current;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isGuidedMode, boardNodes, setReadingMessages]);



  // ── Auto-Scroll to Active Node ──────────────────────────────────
  useEffect(() => {
    if (!activeStep) return;
    
    // Slight delay to allow DOM to render node sizes properly before scrolling
    const timer = setTimeout(() => {
      const activeEl = document.getElementById(`spread-node-${activeStep}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [activeStep, isAwaitingTap]);

  // ── Send handler ──────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;
    const cardName = useBoardStore.getState().nodes[activeStep];
    if (!cardName) return; // Block sending if card hasn't been drawn yet!

    const userText = inputValue;
    setReadingMessages(prev => [...prev, { role: 'user', text: userText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }]);
    setInputValue('');
    setIsTyping(true);
    setIsProcessing(true);

    const isLastNode = activeStep === Object.keys(SPREAD_LIBRARY[activeSpreadId].nodes).length;

    try {
      const cardName = useBoardStore.getState().nodes[activeStep];
      const lastVesperMsg = [...readingMessages].reverse().find(m => m.role === 'vesper');
      const lastVesperQuestion = lastVesperMsg ? lastVesperMsg.text : '';

      const analysis = await analyzeCardReflection(userText, cardName, activeStep, lastVesperQuestion, isLastNode, useBoardStore.getState().readingContext.query);
      let response = analysis.text;
      
      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      if (analysis.isClarificationRequest) {
        setReadingMessages(prev => [...prev, { role: 'vesper' as const, text: response, timestamp: timestampStr }]);
        await speakVesperTextAndWait(response);
        return;
      }

      // Close card view so the tabletop updates since we got a valid reflection
      setFocusedNode(null);

      // Save field observation to current node
      useBoardStore.getState().setCardNote(activeStep, userText);
      
      if (!isLastNode) {
        const variations = [
          "Tap the illuminated node to collapse the probability matrix and draw your next card.",
          "Let's explore the next node to reveal the next coordinate in the matrix.",
          "Go to the flashing node and tap it to download the next layer of data.",
          "Engage the active node to collapse its superposition and draw your next card.",
          "Tap the next node to continue aligning the quantum data streams.",
          "Select the illuminated node to inspect the next step in this spread."
        ];
        const randomPrompt = variations[Math.floor(Math.random() * variations.length)];
        response = response + "\n\n" + randomPrompt;
      } else {
        const synthesisVariations = [
          "Probability matrix is fully stabilized. All nodes have collapsed from superposition. Are you ready to compile the full synthesis report?",
          "The grid nodes are perfectly synchronized. Quantum telemetry data has crystallized. Operator, are you ready to engage the final synthesis protocol?",
          "Every node coordinate has been logged and secured. The Implicate Order is ready to project. Shall we initiate the full operations synthesis?",
          "Data streams are successfully aligned and balanced. Self-actualization pathways have crystallized. Shall I run the final synthesis calculations, Operator?",
          "All tarot node coordinates have been mapped. The probability grid is ready for final grid extraction. Are you prepared to initialize full synthesis?",
          "Occult telemetry synchronization is complete. The Individuation Matrix has locked in. Shall we initiate the compile routine for the full synthesis report?"
        ];
        const randomSynthesisPrompt = synthesisVariations[Math.floor(Math.random() * synthesisVariations.length)];
        response = response + "\n\n" + randomSynthesisPrompt;
      }
      
      setReadingMessages(prev => {
        const nextMsgs = [...prev, { role: 'vesper' as const, text: response, timestamp: timestampStr }];
        if (isLastNode) {
          useBoardStore.getState().setPreSynthesisChat(nextMsgs);
        }
        return nextMsgs;
      });

      // Advance step immediately — check if the spread is now complete
      useBoardStore.getState().advanceGuidedStep();
      const afterAdvance = useBoardStore.getState();

      // Speak Vesper's response in the background (non-blocking)
      setIsVesperSpeaking(true);
      speakVesperTextAndWait(response).finally(() => setIsVesperSpeaking(false));

      if (afterAdvance.isFullReportReady) {
        useBoardStore.getState().setAwaitingSynthesisConfirm(true);
        return;
      }

      // Brief beat then enable tap prompt on the next node
      await new Promise(r => setTimeout(r, 600));
      setIsAwaitingTap(true);
    } catch (error) {
      console.error(error);
      setReadingMessages(prev => [...prev, { role: 'vesper', text: '[ ERROR: UPLINK SEVERED ]', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }]);
    } finally {
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  // ── Node Submit Handler from Modal ──────────────────────────────
  const handleNodeSubmit = async (userText: string, submittedNodeId: number = activeStep) => {
    setIsProcessing(true);
    const totalNodes = Object.keys(SPREAD_LIBRARY[activeSpreadId].nodes).length;
    const currentNodes = useBoardStore.getState().nodes;
    const isSpreadComplete = Object.keys(currentNodes).length === totalNodes;
    
    try {
      const cardName = currentNodes[submittedNodeId];
      const lastVesperMsg = [...readingMessages].reverse().find(m => m.role === 'vesper');
      const lastVesperQuestion = lastVesperMsg ? lastVesperMsg.text : '';

      const analysis = await analyzeCardReflection(userText, cardName, submittedNodeId, lastVesperQuestion, isSpreadComplete, useBoardStore.getState().readingContext.query);
      let response = analysis.text;
      
      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      if (analysis.isClarificationRequest) {
        setReadingMessages(prev => [...prev, { role: 'vesper' as const, text: response, timestamp: timestampStr }]);
        await speakVesperTextAndWait(response);
        return;
      }

      // Save field observation to current node
      useBoardStore.getState().setCardNote(submittedNodeId, userText);

      if (!isSpreadComplete) {
        const variations = [
          "Tap the illuminated node to collapse the probability matrix and draw your next card.",
          "Let's explore the next node to reveal the next coordinate in the matrix.",
          "Go to the flashing node and tap it to download the next layer of data.",
          "Engage the active node to collapse its superposition and draw your next card.",
          "Tap the next node to continue aligning the quantum data streams.",
          "Select the illuminated node to inspect the next step in this spread."
        ];
        const randomPrompt = variations[Math.floor(Math.random() * variations.length)];
        response = response + "\n\n" + randomPrompt;
      } else {
        const synthesisVariations = [
          "Probability matrix is fully stabilized. All nodes have collapsed from superposition. Are you ready to compile the full synthesis report?",
          "The grid nodes are perfectly synchronized. Quantum telemetry data has crystallized. Operator, are you ready to engage the final synthesis protocol?",
          "Every node coordinate has been logged and secured. The Implicate Order is ready to project. Shall we initiate the full operations synthesis?",
          "Data streams are successfully aligned and balanced. Self-actualization pathways have crystallized. Shall I run the final synthesis calculations, Operator?",
          "All tarot node coordinates have been mapped. The probability grid is ready for final grid extraction. Are you prepared to initialize full synthesis?",
          "Occult telemetry synchronization is complete. The Individuation Matrix has locked in. Shall we initiate the compile routine for the full synthesis report?"
        ];
        const randomSynthesisPrompt = synthesisVariations[Math.floor(Math.random() * synthesisVariations.length)];
        response = response + "\n\n" + randomSynthesisPrompt;
      }
      
      setReadingMessages(prev => {
        const nextMsgs = [...prev, { role: 'vesper' as const, text: response, timestamp: timestampStr }];
        if (isSpreadComplete) {
          useBoardStore.getState().setPreSynthesisChat(nextMsgs);
        }
        return nextMsgs;
      });
      // Advance step immediately - check if the spread is now complete
      useBoardStore.getState().advanceGuidedStep();
      const afterAdvance = useBoardStore.getState();

      // Speak Vesper's response in the background (non-blocking)
      setIsVesperSpeaking(true);
      speakVesperTextAndWait(response).finally(() => setIsVesperSpeaking(false));

      if (afterAdvance.isFullReportReady) {
        useBoardStore.getState().setAwaitingSynthesisConfirm(true);
        return;
      }

      await new Promise(r => setTimeout(r, 600));
      setIsAwaitingTap(true);
    } catch (error) {
      console.error(error);
      setReadingMessages(prev => [...prev, { role: 'vesper', text: '[ ERROR: UPLINK SEVERED ]', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Node tap handler ──────────────────────────────────────────────
  const handleNodeTap = async (id: number, x: number, y: number) => {
    oscRouter.dispatchRigLookAt(id, activeSpreadId, x, y);

    if (!isGuidedMode) {
      // Manual Mode: tap any node to either select/draw or view it
      setIsAwaitingTap(false);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      setFocusedNode(id);
      return;
    }

    // Guided Mode: Enforce sequence. Tap on the active undrawn node is allowed.
    if (id === activeStep && !boardNodes[id]) {
      setIsAwaitingTap(false);

      // Draw the card automatically
      useBoardStore.getState().drawNextGuidedCard();
      const state = useBoardStore.getState();
      const cardName = state.nodes[id];
      if (!cardName) return;

      // Open modal to show the card.
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      setFocusedNode(id);
      return;
    }

    // Guided Mode: never open the search modal for any other undrawn node out of sequence
    if (!boardNodes[id]) return;

    // Otherwise just open the detail modal (populated node)
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    setFocusedNode(id);
  };

  const voiceOnlyMode = !textOutputEnabled;

  return (
    <div 
      className="material-background" 
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        ['--terminal-height' as any]: 'clamp(180px, 30dvh, 260px)'
      }}
    >

      <VesperHeader
        title="MISSION GRID INTERFACE"
        accentColor="var(--eva-cyan)"
        telemetryData={[
          { icon: <Layout size={14} />, label: 'GRID', value: SPREAD_LIBRARY[activeSpreadId]?.name || 'UNKNOWN', scramble: false }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <motion.div
              onClick={() => setShowConfirmReset(true)}
              className="material-terminal"
              style={{
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '0 12px', height: '44px',
                color: 'var(--void-black)',
                background: 'var(--magi-orange)',
                border: '1px solid var(--magi-orange)',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}
              whileTap={{ scale: 0.95 }}
              title="New Spread"
            >
              <Plus size={16} /> NEW
            </motion.div>
          </div>
        }
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="terminal-frame"
              style={{
                padding: '30px',
                width: '100%',
                maxWidth: '400px',
                border: '2px solid rgba(255, 50, 50, 0.6)',
                boxShadow: '0 0 30px rgba(255, 50, 50, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                background: 'rgba(5, 7, 10, 0.98)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ff3232' }}>
                <AlertTriangle size={24} />
                <h3 style={{ margin: 0, letterSpacing: '3px', fontSize: '1rem', fontFamily: 'monospace' }}>[ CONFIRM DELETION ]</h3>
              </div>
              <div style={{ color: 'var(--ghost-white)', fontSize: '0.85rem', fontFamily: 'monospace', lineHeight: '1.6' }}>
                {'> WARNING: This will permanently purge the current probability matrix and initialize a new grid. Current telemetry will be lost. This operation cannot be reversed.'}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowConfirmReset(false)}
                  className="primary-btn"
                  style={{ flex: 1, fontSize: '0.8rem', borderColor: 'rgba(255,255,255,0.3)', color: 'var(--ghost-white)' }}
                >
                  [ ABORT ]
                </motion.button>
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255, 50, 50, 0.2)', scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowConfirmReset(false);
                    clearSpeechQueue();
                    resetGrid();
                  }}
                  className="primary-btn"
                  style={{ flex: 1, fontSize: '0.8rem', borderColor: 'rgba(255, 50, 50, 0.6)', color: '#ff3232', backgroundColor: 'rgba(255, 50, 50, 0.05)' }}
                >
                  [ EXEC ]
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Canvas */}
      <div 
        className="custom-scrollbar"
        style={{ 
          flex: 1, 
          position: 'relative', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          paddingBottom: '340px'
        }}
      >
         <div style={{ 
          width: '100vw', 
          maxWidth: '480px',
          margin: '0 auto',
          position: 'relative',
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          pointerEvents: 'none'
        }}>
          <div style={{
            width: '100%',
            height: '1200px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: is3DMode ? 'scale(1.18) rotateX(28deg) translateY(-30px) translateZ(0)' : 'scale(1.18)',
            transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
            pointerEvents: 'none'
          }}>
            <SpreadRenderer
              spreadId={activeSpreadId}
              nodesRecord={boardNodes}
              activeStep={activeStep}
              onNodeTap={handleNodeTap}
              isAwaitingTap={isAwaitingTap}
            />
          </div>
        </div>
      </div>

      {/* Bottom Chat/Feed Panel */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: isFeedExpanded ? 0 : 'calc(100% - 48px)' }}
        style={{
          position: 'fixed',
          bottom: 'var(--tabbar-total)',
          left: 0,
          right: 0,
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          height: '40dvh',
          minHeight: '220px',
          zIndex: 400,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'transparent',
          padding: '12px 6px 16px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          pointerEvents: 'none'
        }}
      >
        {/* Panel Header — Archive block style */}
        <TerminalFrame
          title="VESPER TERMINAL"
          accentColor="var(--eva-cyan)"
          onHeaderClick={() => setIsFeedExpanded(!isFeedExpanded)}
          headerActions={
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6, fontSize: '0.65rem' }}>
              {isFeedExpanded ? '[ COLLAPSE ]' : '[ EXPAND ]'}
              {isFeedExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </span>
          }
          style={{ flex: 1, minHeight: 0, pointerEvents: 'auto' }}
          contentStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: isGuidedMode ? '10px 8px 8px' : '12px 8px', gap: '8px' }}
        >
          {/* Panel Content (Unified for Guided and Manual) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Messages */}
            <TerminalMessageList
              messages={readingMessages as VesperMessage[]}
              isTyping={isTyping}
              voiceOnlyMode={voiceOnlyMode}
              accentColor="var(--eva-cyan)"
              style={{ flex: 1, overflowY: 'auto', marginBottom: '8px' }}
            />

            {/* Input */}
            {voiceOnlyMode ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
                <motion.button
                  whileTap={boardNodes[activeStep] ? { scale: 0.9 } : undefined}
                  onClick={boardNodes[activeStep] ? toggleListen : undefined}
                  disabled={!boardNodes[activeStep]}
                  style={{
                    background: isListening ? 'rgba(0,240,255,0.2)' : 'rgba(0,240,255,0.08)',
                    border: `2px solid ${isListening ? 'var(--eva-cyan)' : (!boardNodes[activeStep] ? 'rgba(0,240,255,0.2)' : 'var(--eva-cyan)')}`,
                    color: isListening ? 'var(--eva-cyan)' : (!boardNodes[activeStep] ? 'rgba(0,240,255,0.3)' : 'var(--eva-cyan)'),
                    borderRadius: '50%', width: '48px', height: '48px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: !boardNodes[activeStep] ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Mic size={20} />
                </motion.button>
              </div>
            ) : isAwaitingSynthesisConfirm ? (
              <div style={{ display: 'flex', borderTop: '1px solid var(--eva-cyan)', padding: '6px 4px', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <motion.button
                  whileHover={!isVesperSpeaking ? { opacity: 0.9 } : {}}
                  whileTap={!isVesperSpeaking ? { scale: 0.96 } : {}}
                  onClick={() => {
                    if (isVesperSpeaking) return;
                    setAwaitingSynthesisConfirm(false);
                    triggerFullReport();
                  }}
                  style={{
                    width: '100%',
                    height: '32px',
                    backgroundColor: isVesperSpeaking ? 'rgba(0, 240, 255, 0.15)' : 'var(--eva-cyan)',
                    border: '1px solid var(--eva-cyan)',
                    color: isVesperSpeaking ? 'rgba(0, 240, 255, 0.4)' : 'var(--void-black)',
                    padding: '0 12px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    letterSpacing: '1.5px',
                    cursor: isVesperSpeaking ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  disabled={isVesperSpeaking}
                >
                  {isVesperSpeaking ? '[ AWAITING TRANSMISSION ]' : '▶ [ INITIALIZE FULL SYNTHESIS ]'}
                </motion.button>
              </div>
            ) : (
              <div style={{ display: 'flex', borderTop: '1px solid rgba(0,240,255,0.2)', padding: '8px 4px', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text" value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={!boardNodes[activeStep] ? "[ TAP ILLUMINATED NODE TO DRAW CARD ] ↑" : "Enter message"}
                  disabled={!boardNodes[activeStep]}
                  style={{ 
                    flex: 1, 
                    background: 'transparent', 
                    border: 'none', 
                    color: !boardNodes[activeStep] ? 'rgba(0, 240, 255, 0.65)' : 'var(--eva-cyan)', 
                    fontFamily: 'monospace', 
                    fontSize: '16px', 
                    outline: 'none', 
                    paddingLeft: '8px',
                    cursor: !boardNodes[activeStep] ? 'not-allowed' : 'text'
                  }}
                />
                {inputValue.trim() && boardNodes[activeStep] ? (
                  <motion.button whileTap={{ scale: 0.88 }} onClick={handleSend}
                    style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid var(--eva-cyan)', color: 'var(--eva-cyan)', borderRadius: '50%', width: '32px', height: '32px', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Send size={14} />
                  </motion.button>
                ) : (
                  <motion.button 
                    whileTap={boardNodes[activeStep] ? { scale: 0.88 } : undefined} 
                    onClick={boardNodes[activeStep] ? toggleListen : undefined}
                    disabled={!boardNodes[activeStep]}
                    style={{ 
                      background: isListening ? 'rgba(0,240,255,0.15)' : 'transparent', 
                      border: `1px solid ${isListening ? 'var(--eva-cyan)' : (!boardNodes[activeStep] ? 'rgba(0,240,255,0.15)' : 'rgba(0,240,255,0.3)')}`, 
                      color: isListening ? 'var(--eva-cyan)' : (!boardNodes[activeStep] ? 'rgba(0,240,255,0.3)' : 'var(--eva-cyan)'), 
                      borderRadius: '50%', 
                      width: '32px', 
                      height: '32px', 
                      minWidth: '32px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: !boardNodes[activeStep] ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    <Mic size={14} />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </TerminalFrame>
      </motion.div>

      {/* Synthesis Overlay */}
      {isSynthesisActive && <SynthesisTerminal />}

      <NodeFocusModal 
        nodeId={focusedNode} 
        onClose={() => setFocusedNode(null)} 
        addMessage={(role, text) => setReadingMessages(prev => [...prev, { role, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }])}
        onNodeSubmit={handleNodeSubmit}
      />
      <ReadingConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
};


// ─── Main Tabletop View (Router) ─────────────────────────────────────

export const TabletopView = () => {
  const gridInitialized = useBoardStore((state) => state.gridInitialized);
  const initializeGrid  = useBoardStore((state) => state.initializeGrid);
  const setGuidedMode   = useBoardStore((state) => state.setGuidedMode);

  if (!gridInitialized) {
    return (
      <SpreadSelectorGuide
        onConfirm={(spreadId) => {
          setGuidedMode(true);
          initializeGrid(spreadId);
        }}
      />
    );
  }

  return <ActiveGridView />;
};

