import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import { useBoardStore } from '../../modules/StateManager/boardState';
import { useRecordStore } from '../../modules/StateManager/recordStore';
import { useVesperStore } from '../../modules/StateManager/vesperStore';
import type { Message } from '../../modules/StateManager/vesperStore';
import { chatAboutReadingStream, generateReadingSummary } from '../../modules/Network/geminiService';
import { setVoiceEnabled, clearSpeechQueue, speakVesperText } from '../../modules/utils/vesperSpeech';
import { SPREAD_LIBRARY } from '../../modules/StateManager/spreadLibrary';
import { TerminalFrame, TerminalMessageList } from './VesperTerminal';
import { NodeFocusModal } from './NodeFocusModal';
import { VesperHeader } from './VesperHeader';
import { VesperGlobalControls } from './VesperGlobalControls';
import { Send, Mic, Terminal as TerminalIcon, Layout } from 'lucide-react';

export const SynthesisTerminal = () => {
  const {
    nodes,
    activeSpreadId,
    synthesisReport,
    resetSynthesis,
    clearBoard,
    readingContext,
    isGuidedMode,
    cardNotes,
    preSynthesisChat
  } = useBoardStore(
    useShallow((state) => ({
      nodes: state.nodes,
      activeSpreadId: state.activeSpreadId,
      synthesisReport: state.synthesisReport,
      resetSynthesis: state.resetSynthesis,
      clearBoard: state.clearBoard,
      readingContext: state.readingContext,
      isGuidedMode: state.isGuidedMode,
      cardNotes: state.cardNotes,
      preSynthesisChat: state.preSynthesisChat
    }))
  );

  const { voiceModeEnabled } = useVesperStore(
    useShallow((state) => ({
      voiceModeEnabled: state.audioOutputEnabled,
    }))
  );
  const addRecord = useRecordStore((state) => state.addRecord);

  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [phase, setPhase] = useState<'BOOT' | 'RESULTS'>('BOOT');
  const [dashboardTab, setDashboardTab] = useState<'OVERVIEW' | 'NODES'>('OVERVIEW');
  
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);
  const [finalSynthesisData, setFinalSynthesisData] = useState<any>(null);
  const [synthesisFetchStatus, setSynthesisFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setVoiceEnabled(voiceModeEnabled);
  }, [voiceModeEnabled]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setChatInput(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setChatInput('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const chatHistoryRef = useRef(chatHistory);
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  const isChatLoadingRef = useRef(isChatLoading);
  useEffect(() => {
    isChatLoadingRef.current = isChatLoading;
  }, [isChatLoading]);

  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const cardNotesRef = useRef(cardNotes);
  useEffect(() => {
    cardNotesRef.current = cardNotes;
  }, [cardNotes]);

  const triggerAutonomousInterjection = useCallback(async () => {
    setIsChatLoading(true);
    const readingData = Object.entries(nodesRef.current).map(([id, card]) => `Node ${id}: ${card} \nUser Notes: ${cardNotesRef.current[parseInt(id)] || 'None'}`).join('\n\n');
    const autonomousPrompt = [...chatHistoryRef.current, { role: 'user' as const, text: "*[Operator has been idle for 45 seconds. Proactively comment on their inaction or the spread itself to wake them up. Do not mention that they are idle in typical bot terms, frame it cryptically.]*" }];
    try {
      const stream = await chatAboutReadingStream(autonomousPrompt, readingData);
      let fullResponse = "";
      setChatHistory(prev => [...prev, { role: 'vesper', text: '' }]);
      let pendingUpdate = false;
      for await (const chunk of stream) {
        fullResponse += chunk;
        if (!pendingUpdate) {
          pendingUpdate = true;
          requestAnimationFrame(() => {
            setChatHistory(prev => {
              const newHistory = [...prev];
              newHistory[newHistory.length - 1].text = fullResponse;
              return newHistory;
            });
            pendingUpdate = false;
          });
        }
      }
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].text = fullResponse;
        return newHistory;
      });
    } catch (e) {
      console.error(e);
      setIsChatLoading(false);
    } finally {
      setIsChatLoading(false);
    }
  }, []);

  // --- AUTONOMOUS IDLE TRACKER ---
  useEffect(() => {
    if (phase !== 'RESULTS') return;

    let timeout: ReturnType<typeof setTimeout>;
    const resetIdleTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
         if (!isChatLoadingRef.current) {
           triggerAutonomousInterjection();
         }
      }, 45000);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);
    resetIdleTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
    };
  }, [phase, triggerAutonomousInterjection]);
  // --------------------------------

  // Fetch Final Synthesis Data in background
  useEffect(() => {
    if (synthesisReport && synthesisFetchStatus === 'idle') {
      setSynthesisFetchStatus('loading');
      
      const queryPart = readingContext.query ? `OPERATOR INTENTION / QUERY: ${readingContext.query}\n\n` : '';
      const readingData = queryPart + Object.entries(nodes).map(([id, card]) => {
        const spreadDef = SPREAD_LIBRARY[activeSpreadId];
        const prompt = spreadDef?.nodes[parseInt(id) - 1]?.description || '';
        return `Node ${id}: ${card} \nPrompt: ${prompt}\nUser Notes: ${cardNotes[parseInt(id)] || 'None'}`;
      }).join('\n\n') + '\n\nTELEMETRY:\n' + (readingContext.env ? JSON.stringify(readingContext.env) : 'NONE');

      import('../../modules/Network/geminiService').then(({ generateFinalSynthesisData }) => {
        generateFinalSynthesisData(preSynthesisChat, readingData).then(data => {
          setFinalSynthesisData({
            ...data,
            telemetrySnapshot: readingContext.env ? `METEO: ${readingContext.env.weather?.temp}°C | COORD: ${readingContext.env.location?.lat},${readingContext.env.location?.lon} | BATT: ${Math.round((readingContext.env.battery?.level || 0)*100)}% | K-INDEX: ${synthesisReport.stressors.kIndex}` : "OFFLINE",
            nodes: Object.entries(nodes).map(([id, card]) => {
              const spreadDef = SPREAD_LIBRARY[activeSpreadId];
              const prompt = spreadDef?.nodes[parseInt(id) - 1]?.description || '';
              return { index: parseInt(id), card, prompt, userAnswer: cardNotes[parseInt(id)] || 'None' };
            })
          });
          setSynthesisFetchStatus('success');
        }).catch(err => {
          console.error(err);
          setSynthesisFetchStatus('error');
        });
      });
    }
  }, [synthesisReport, synthesisFetchStatus, activeSpreadId, nodes, readingContext, cardNotes, preSynthesisChat]);

  // Fresh Chat Synthesis Interpretation Loader
  useEffect(() => {
    if (synthesisReport && phase === 'RESULTS' && chatHistory.length === 0 && finalSynthesisData) {
      const fullText = `${finalSynthesisData.spokenConcise}\n\n[ FINAL OUTCOME ]\n${finalSynthesisData.finalOutcome}`;
      setChatHistory([{ 
        role: 'vesper', 
        text: fullText
      }]);
      speakVesperText(finalSynthesisData.spokenConcise);
      speakVesperText(finalSynthesisData.finalOutcome);
    }
  }, [synthesisReport, phase, chatHistory.length, finalSynthesisData]);

  // Memoize log lines to avoid stale closure issues
  const nodeCount = Object.keys(nodes).length;
  const logs = useMemo(() => [
    "[ SYSTEM_INIT ] INITIALIZING VESPER_ARCANE_INTERFACE_v4.0.2",
    "[ BIOS ] INTEL 80486DX4 VERIFYING MEMORY REGISTERS: OK",
    "[ OSC_BRIDGE ] UDP:4000 ONLINE. SECURING TABLETOP UPLINK...",
    "[ SCANNING_NODES ] DETECTING POPULATED QUANTUM NODES...",
    `[ NODE_COUNT ] ${nodeCount} / ${nodeCount} NODES COLLAPSED FROM SUPERPOSITION`,
    "[ INDIVIDUATION ] ALIGNING COGNITIVE FREQUENCY PATTERNS...",
    "[ RESONANCE ] SCHUMANN RESONANCE BASELINE: 7.83Hz COHERENT",
    "[ KERNEL ] LOADING ESOTERIC_CALCULUS_PATCH_v9.0.2...",
    "[ ANALYSIS ] DECRYPTING NODE ID MEANINGS AND JUNG ARCHETYPES...",
    "[ SYNERGY ] MATRIX DENSITY STABILITY CALCULATED: 100% SECURE",
    "[ DATA_FLUSH ] COMPILING HEAVY ELEMENTAL DIALECTS...",
    "[ EGREGO_PET ] EGREGO-PET EVOLUTION MATRIX STABILIZED",
    "[ WARNING ] HIGH ENERGY COHERENCE DEVIATION DETECTED... BYPASSED",
    "[ SUCCESS ] OCCULT TELEMETRY EXTRACTION COMPLETE",
    "[ SYSTEM ] GENERATING FULL SYNTHESIS OPERATIONS REPORT..."
  ], [nodeCount]);

  useEffect(() => {
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logs.length) {
        setBootLogs(prev => [...prev, logs[currentLog]]);
        currentLog++;
      } else {
        clearInterval(interval);
        setTimeout(() => setPhase('RESULTS'), 1000);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [logs]);

  // Auto-scroll boot logs
  const bootLogsRef = useRef<HTMLDivElement>(null);
  const bootLogsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase === 'BOOT') {
      bootLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [bootLogs, phase]);

  const handleSendChat = async (overrideText?: string) => {
    const userMessage = overrideText || chatInput.trim();
    if (!userMessage || isChatLoading) return;
    
    if (!overrideText) setChatInput('');
    
    const updatedHistory: Message[] = [...chatHistory, { role: 'user', text: userMessage }];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);
    
    const queryPart = readingContext.query ? `OPERATOR INTENTION / QUERY: ${readingContext.query}\n\n` : '';
    const readingData = queryPart + Object.entries(nodes).map(([id, card]) => `Node ${id}: ${card} \nUser Notes: ${cardNotes[parseInt(id)] || 'None'}`).join('\n\n');
    
    try {
      const stream = await chatAboutReadingStream(updatedHistory, readingData);
      
      let fullResponse = "";
      setChatHistory(prev => [...prev, { role: 'vesper', text: '' }]);
      
      let pendingUpdate = false;
      for await (const chunk of stream) {
        fullResponse += chunk;
        if (!pendingUpdate) {
          pendingUpdate = true;
          requestAnimationFrame(() => {
            setChatHistory(prev => {
              const newHistory = [...prev];
              newHistory[newHistory.length - 1].text = fullResponse;
              return newHistory;
            });
            pendingUpdate = false;
          });
        }
      }
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].text = fullResponse;
        return newHistory;
      });
    } catch (e) {
       console.error(e);
       setChatHistory(prev => {
         const newHistory = [...prev];
         newHistory[newHistory.length - 1] = { role: 'vesper', text: '[ ERROR: UPLINK SEVERED ]' };
         return newHistory;
       });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!synthesisReport) return;
    
    setIsArchiving(true);
    let finalSynthesisText = synthesisReport.gridSummary;

    if (isGuidedMode) {
      const spreadDef = SPREAD_LIBRARY[activeSpreadId];
      const envData = `INTENT QUERY: ${readingContext.query || 'None'}\n` + (readingContext.env ? JSON.stringify(readingContext.env, null, 2) : "NO_TELEMETRY");
      const localTime = new Date().toLocaleTimeString();
      const formattedPreChat = preSynthesisChat.map(h => `${h.role === 'user' ? 'Operator' : 'Vesper'}: ${h.text}`).join('\n');

      const readingData = `
SPREAD TYPE: ${synthesisReport.spreadName}
LOCAL TIME: ${localTime}
TELEMETRY:
${envData}

NODE BREAKDOWN:
${Object.entries(nodes).map(([id, card]) => {
  const nodeMeaning = spreadDef.nodes[parseInt(id) - 1]?.title || "Unknown Position";
  return `Node ${id} (${nodeMeaning}): ${card}\nOperator Input: ${cardNotes[parseInt(id)] || 'None'}`;
}).join('\n\n')}

PRE-SYNTHESIS GRID DISCUSSION:
${formattedPreChat}
      `.trim();

      const summary = await generateReadingSummary(chatHistory, readingData);
      finalSynthesisText = ">> POST-MISSION SYNTHESIS REPORT\n\n" + summary;
    }

    addRecord({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      subjectName: "OPERATOR",
      spreadId: activeSpreadId,
      spreadName: synthesisReport.spreadName,
      nodes: nodes,
      synthesis: finalSynthesisText,
      cardNotes: cardNotes,
      query: readingContext.query
    });
    
    setIsArchiving(false);
    clearSpeechQueue();
    clearBoard();
  };

  if (!synthesisReport) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, bottom: 'var(--tabbar-total)', right: 0,
      backgroundColor: 'var(--void-black)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--sans)',
      color: 'var(--eva-cyan)',
      padding: '0px',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      overflow: 'hidden',
      touchAction: 'none'
    }}>
      <div className="scanline" style={{ opacity: 0.1 }} />

      <AnimatePresence mode="wait">
        {phase === 'BOOT' ? (
          <motion.div 
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}
          >
            <div style={{ borderBottom: '1px solid var(--eva-cyan)', marginBottom: '10px', paddingBottom: '4px' }}>
              <h1 style={{ margin: 0, fontSize: '1rem', letterSpacing: '2px' }}>[ Synthesis results ]</h1>
            </div>
            
            <div ref={bootLogsRef} style={{ flex: 1, overflowY: 'auto' }}>
              {bootLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: '8px', fontSize: '0.8rem' }}>
                  {log}
                </div>
              ))}
              <motion.div 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ width: '8px', height: '14px', background: 'var(--eva-cyan)', display: 'inline-block' }}
              />
              <div ref={bootLogsEndRef} />
            </div>
            
            <div style={{ padding: '10px', borderTop: '1px solid rgba(0,240,255,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', marginBottom: '4px' }}>
                <span>SYNC...</span>
                <span>{Math.min(Math.round(bootLogs.length / logs.length * 100), 100)}%</span>
              </div>
              <div style={{ height: '2px', background: 'rgba(0,240,255,0.1)', width: '100%' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(bootLogs.length / logs.length) * 100}%` }}
                  style={{ height: '100%', background: 'var(--eva-cyan)' }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <VesperHeader
              title="SYNTHESIS RESULTS"
              accentColor="var(--eva-cyan)"
              telemetryData={[
                { icon: <Layout size={14} />, label: 'GRID', value: synthesisReport.spreadName.toUpperCase(), color: 'var(--eva-cyan)' }
              ]}
              actions={<VesperGlobalControls />}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '14px', overflow: 'hidden', minHeight: 0 }}>
              
              {/* Toggle tabs for top dashboard panel */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', flexShrink: 0 }}>
                {['OVERVIEW', 'NODES & REFLECTIONS'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDashboardTab(tab === 'OVERVIEW' ? 'OVERVIEW' : 'NODES')}
                    style={{
                      flex: 1,
                      background: (dashboardTab === 'OVERVIEW' && tab === 'OVERVIEW') || (dashboardTab === 'NODES' && tab === 'NODES & REFLECTIONS') ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                      border: 'none',
                      color: (dashboardTab === 'OVERVIEW' && tab === 'OVERVIEW') || (dashboardTab === 'NODES' && tab === 'NODES & REFLECTIONS') ? 'var(--eva-cyan)' : 'var(--ghost-white)',
                      padding: '10px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      letterSpacing: '1px',
                      borderBottom: (dashboardTab === 'OVERVIEW' && tab === 'OVERVIEW') || (dashboardTab === 'NODES' && tab === 'NODES & REFLECTIONS') ? '2px solid var(--eva-cyan)' : 'none',
                      transition: 'none'
                    }}
                  >
                    [ {tab} ]
                  </button>
                ))}
              </div>

              {/* TOP HALF: Scrollable dashboard panel */}
              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {dashboardTab === 'OVERVIEW' ? (
                  <>
                    {/* Full Final Synthesis Report Text Block */}
                    <div style={{ border: '1px solid var(--eva-cyan)', padding: '15px', background: 'rgba(0, 240, 255, 0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--eva-cyan)', fontWeight: 'bold', letterSpacing: '1px' }}>[ QUANTUM GRID SYNTHESIS ]</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ghost-white)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {synthesisReport.gridSummary}
                      </div>
                    </div>



                    {/* High Density 2-Column Grid: Elements & Telemetry */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      {/* Elements Column */}
                      <div style={{ padding: '12px', border: '1px solid rgba(0, 240, 255, 0.15)', background: 'rgba(0, 240, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--eva-cyan)', fontWeight: 'bold', letterSpacing: '1px' }}>ELEMENTS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {Object.entries(synthesisReport.elements).map(([el, score]) => (
                            <div key={el} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <div style={{ width: '40px', fontSize: '0.6rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{el}</div>
                               <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(score / 5) * 100}%` }}
                                    style={{ 
                                      height: '100%', 
                                      background: el === 'FIRE' ? 'var(--magi-orange)' : 
                                                 el === 'WATER' ? 'var(--vesper-blue)' : 
                                                 el === 'EARTH' ? 'var(--bios-green)' : 'var(--magi-violet)' 
                                    }}
                                  />
                               </div>
                               <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', width: '12px', textAlign: 'right' }}>{score}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Telemetry Column */}
                      <div style={{ border: '1px solid rgba(0, 240, 255, 0.15)', padding: '12px', background: 'rgba(0, 240, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                        <div style={{ color: 'var(--eva-cyan)', fontWeight: 'bold', fontSize: '0.65rem', letterSpacing: '1px' }}>TELEMETRY</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          <span style={{ opacity: 0.7 }}>METEO:</span>
                          <span style={{ color: 'var(--ghost-white)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{readingContext.env?.weather?.status === 'ONLINE' ? `${readingContext.env.weather.temp}°C` : "STABLE"}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          <span style={{ opacity: 0.7 }}>COORD:</span>
                          <span style={{ color: 'var(--ghost-white)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{readingContext.env?.location?.status === 'ONLINE' ? `${readingContext.env.location.lat}, ${readingContext.env.location.lon}` : "UNAVAILABLE"}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          <span style={{ opacity: 0.7 }}>POWER:</span>
                          <span style={{ color: 'var(--ghost-white)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{readingContext.env?.battery?.level !== null && readingContext.env?.battery?.level !== undefined ? Math.round(readingContext.env.battery.level * 100) + '%' : "UNKNOWN"}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          <span style={{ opacity: 0.7 }}>K-INDEX:</span>
                          <span style={{ color: synthesisReport.stressors.frictionApplied ? 'var(--magi-orange)' : 'var(--bios-green)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {synthesisReport.stressors.kIndex} ({synthesisReport.stressors.frictionApplied ? 'STORM' : 'NORM'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {readingContext.query && (
                      <div style={{ padding: '10px 12px', border: '1px solid var(--eva-cyan)', background: 'rgba(0, 240, 255, 0.03)', color: 'var(--eva-cyan)', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '4px' }}>
                        [ OPERATOR INQUIRY: "{readingContext.query.toUpperCase()}" ]
                      </div>
                    )}
                    {Object.entries(nodes).map(([id, cardName]) => {
                      const spreadDef = SPREAD_LIBRARY[activeSpreadId];
                      const nodeDef = spreadDef?.nodes[parseInt(id) - 1];
                      return (
                        <div 
                          key={id} 
                          onClick={() => setFocusedNodeId(parseInt(id))}
                          className="material-terminal node-reflection-row"
                          style={{ 
                            border: '1px solid var(--magi-orange)', 
                            padding: '12px', 
                            background: 'rgba(255, 102, 0, 0.02)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          {/* Card Name (Above node name, left aligned) */}
                          <div style={{ 
                            fontSize: '0.7rem', 
                            color: 'var(--eva-cyan)', 
                            fontWeight: 'bold', 
                            letterSpacing: '1px',
                            fontFamily: 'monospace'
                          }}>
                            [ CARD: {cardName.toUpperCase()} ]
                          </div>

                          {/* Node Title */}
                          <div style={{ 
                            color: 'var(--magi-orange)', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold', 
                            fontFamily: 'monospace' 
                          }}>
                            NODE {id}: {nodeDef?.title.toUpperCase() || 'Unknown'}
                          </div>

                          {/* Node Prompt (Question/Description) */}
                          {nodeDef?.description && (
                            <div style={{ 
                              fontSize: '0.65rem', 
                              color: 'rgba(230, 237, 243, 0.5)', 
                              fontFamily: 'monospace',
                              lineHeight: '1.3'
                            }}>
                              PROMPT: {nodeDef.description}
                            </div>
                          )}

                          {/* User Note */}
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'rgba(230, 237, 243, 0.85)', 
                            fontFamily: 'monospace', 
                            background: 'rgba(5, 7, 10, 0.8)', 
                            padding: '8px', 
                            borderLeft: '2px solid var(--eva-cyan)',
                            marginTop: '4px'
                          }}>
                            {cardNotes[parseInt(id)] ? `"${cardNotes[parseInt(id)]}"` : '[ NO REFLECTION NOTE ENTERED ]'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BOTTOM HALF: Terminal below it where vesper and user chat */}
              <div style={{ height: '32dvh', minHeight: '200px', maxHeight: '300px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <TerminalFrame
                  title="VESPER TERMINAL"
                  accentColor="var(--eva-cyan)"
                  contentStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 12px 8px' }}
                  style={{ flex: 1, minHeight: 0 }}
                >
                  <TerminalMessageList
                    messages={chatHistory}
                    isTyping={isChatLoading}
                    accentColor="var(--eva-cyan)"
                    onOptionSelect={(option) => {
                      if (option === '[ ARCHIVE READING ]') {
                        handleArchive();
                      } else {
                        handleSendChat(option);
                      }
                    }}
                    style={{ flex: 1, overflowY: 'auto', marginBottom: '8px' }}
                  />

                  {/* Input Row */}
                  <div style={{ display: 'flex', borderTop: '1px solid rgba(0,240,255,0.2)', background: 'var(--void-black)', padding: '8px 10px 0px', alignItems: 'center', gap: '8px', zIndex: 1, flexShrink: 0 }}>
                    <TerminalIcon size={15} style={{ color: 'var(--eva-cyan)', flexShrink: 0, opacity: 0.7 }} />
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                      placeholder="Enter message"
                      disabled={isChatLoading}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontFamily: 'monospace',
                        fontSize: '16px',
                        outline: 'none',
                        cursor: isChatLoading ? 'not-allowed' : 'text'
                      }}
                    />
                    {chatInput.trim() ? (
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleSendChat()}
                        style={{ background: 'rgba(255,102,0,0.1)', border: '1px solid var(--magi-orange)', color: 'var(--magi-orange)', borderRadius: '50%', minWidth: '32px', minHeight: '32px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <Send size={14} />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={!isChatLoading ? { scale: 0.88 } : undefined}
                        onClick={!isChatLoading ? toggleRecording : undefined}
                        disabled={isChatLoading}
                        style={{
                          background: isRecording ? 'rgba(255,102,0,0.15)' : 'transparent',
                          border: `1px solid ${isRecording ? 'var(--magi-orange)' : 'var(--eva-cyan)'}`,
                          color: isRecording ? 'var(--magi-orange)' : 'var(--eva-cyan)',
                          borderRadius: '50%',
                          minWidth: '32px',
                          minHeight: '32px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isChatLoading ? 'not-allowed' : 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <Mic size={14} />
                      </motion.button>
                    )}
                  </div>
                </TerminalFrame>
              </div>

              {/* Action buttons footer */}
              <div style={{ flexShrink: 0, display: 'flex', gap: '15px', paddingBottom: '10px' }}>
                 <motion.button 
                   onClick={() => { clearSpeechQueue(); resetSynthesis(); }}
                   whileHover={{ backgroundColor: 'rgba(255, 50, 50, 0.15)', borderColor: '#ff3232', scale: 1.02, boxShadow: '0 0 15px rgba(255, 50, 50, 0.2)' }}
                   whileTap={{ scale: 0.98 }}
                   className="primary-btn" 
                   style={{ flex: 1, fontSize: '0.85rem', borderColor: 'rgba(255, 50, 50, 0.6)', color: '#ff3232', backgroundColor: 'rgba(255, 50, 50, 0.05)', padding: '12px' }}
                 >
                   [ ABORT ]
                 </motion.button>
                 <motion.button 
                   onClick={() => handleArchive()}
                   whileHover={{ backgroundColor: 'var(--eva-cyan)', color: 'var(--void-black)', scale: 1.02, boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)' }}
                   whileTap={{ scale: 0.98 }}
                   disabled={isArchiving}
                   className="primary-btn holographic-border" 
                   style={{ 
                     flex: 1, 
                     fontSize: '0.85rem', 
                     opacity: isArchiving ? 0.7 : 1, 
                     padding: '12px',
                     backgroundColor: 'rgba(0, 240, 255, 0.08)',
                     border: '2px solid var(--eva-cyan)',
                     color: 'var(--eva-cyan)',
                     transition: 'none'
                   }}
                 >
                   {isArchiving ? '[ ARCHIVING... ]' : '[ ARCHIVE ]'}
                 </motion.button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NodeFocusModal 
        nodeId={focusedNodeId} 
        onClose={() => setFocusedNodeId(null)} 
      />
    </div>
  );
};
