import { useState, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, ChevronUp, ChevronDown, Send } from 'lucide-react';
import { ScrambleText } from './ScrambleText';
import { TAROT_DECK } from '../../constants/tarotDictionary';
import { useProfileStore } from '../../modules/StateManager/profileStore';
import { generateDailyReflectionPrompt, analyzeDailyReflection } from '../../modules/Network/geminiService';
import { TerminalFrame, TerminalMessageList, type VesperMessage } from './VesperTerminal';
import { speakVesperTextAndWait, clearSpeechQueue } from '../../modules/utils/vesperSpeech';

const GLYPHS = "010101XYZΩΨΦΣ<>[]/\\|#*+@&$%".split("");

const INNER_WIDTH = 30; // chars between the | borders

function wrapTextToWidth(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

function buildCardWithDirective(
  asciiArt: string, 
  directiveText: string, 
  cardName: string, 
  element: string
): string {
  if (!asciiArt) return '';
  const rawLines = asciiArt.split('\n');
  const pictureStart = 5;
  const pictureEnd = rawLines.findIndex((l, i) => i > pictureStart && (l.includes('* ') || /\[ [A-Z]+ \]/.test(l) || /^[A-Z0-9-IVX]+[ ]+[A-Z ]+$/.test(l.replace(/\|/g,'').trim()) ));
  
  const pictureLines = rawLines.slice(pictureStart, pictureEnd > -1 ? pictureEnd : undefined);
  
  while(pictureLines.length > 0 && pictureLines[pictureLines.length - 1].replace(/\|/g, '').trim() === '') {
     pictureLines.pop();
  }

  const divider = '+' + '='.repeat(INNER_WIDTH) + '+';
  const emptyRow = '|' + ' '.repeat(INNER_WIDTH) + '|';
  const padRow = (content: string, center = false) => {
    if (center) {
      const pad = Math.max(0, INNER_WIDTH - content.length);
      const left = Math.floor(pad / 2);
      const right = pad - left;
      return '|' + ' '.repeat(left) + content + ' '.repeat(right) + '|';
    }
    const pad = Math.max(0, INNER_WIDTH - content.length - 2);
    return '|  ' + content + ' '.repeat(pad) + '|';
  };

  const lines = [];
  lines.push(divider);
  lines.push(padRow(cardName, true));
  if (element) {
    lines.push(padRow(`Elem: ${element}`, true));
  }
  lines.push(emptyRow);
  
  pictureLines.forEach(l => {
    lines.push(l);
  });
  
  lines.push(emptyRow);
  lines.push(divider);
  
  if (directiveText) {
    const wrapped = wrapTextToWidth(directiveText, INNER_WIDTH - 4);
    wrapped.forEach(w => lines.push(padRow(w, false)));
  }
  
  lines.push(divider);
  return lines.join('\n');
}

interface ScrambledAsciiProps {
  text: string;
  className?: string;
  style?: CSSProperties;
}

const ScrambledAscii = ({ text, className, style }: ScrambledAsciiProps) => {
  const [displayText, setDisplayText] = useState(text);
  
  useEffect(() => {
    let iteration = 0;
    const maxIterations = 25;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayText(text.split('').map(char => char === '\n' || char === ' ' ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(''));

    const interval = setInterval(() => {
      setDisplayText(() => 
        text.split('').map((char, index) => {
          if (char === '\n' || char === ' ') return char;
          if (index < (text.length / maxIterations) * iteration) {
            return char;
          }
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }).join('')
      );
      
      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
      }
      iteration += 1;
    }, 40);

    return () => clearInterval(interval);
  }, [text]);

  return <pre className={className} style={style}>{displayText}</pre>;
};

interface DailyReflectionModalProps {
  onClose: () => void;
}

export const DailyReflectionModal = ({ onClose }: DailyReflectionModalProps) => {
  const { addJournalEntry, journalEntries } = useProfileStore();
  const [phase, setPhase] = useState<'intro' | 'drawing' | 'drawn' | 'writing' | 'saved'>('intro');
  const [drawnCard, setDrawnCard] = useState<typeof TAROT_DECK[0] | null>(null);
  const [vesperPrompt, setVesperPrompt] = useState<string>('');
  const [journalInput, setJournalInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClarifying, setIsClarifying] = useState(false);
  const [chatHistory, setChatHistory] = useState<VesperMessage[]>([]);
  const [asciiArtText, setAsciiArtText] = useState<string>('');
  
  // Charge states for hold-to-reveal loot box interaction
  const [charge, setCharge] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  
  // Refs to hold loading promises for pre-fetching at 50%
  const asciiPromiseRef = useRef<Promise<void> | null>(null);
  const promptPromiseRef = useRef<Promise<string> | null>(null);
  const scanSessionIdRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isFeedExpanded, setIsFeedExpanded] = useState(true);
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Clear speech queue on unmount
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
      if (final) setJournalInput(prev => (prev + ' ' + final).trim());
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try { 
        recognitionRef.current.start(); 
        setIsListening(true); 
      } catch (e) { 
        console.error('Recognition start failed', e); 
      }
    }
  };

  const messages = useMemo<VesperMessage[]>(() => {
    if (!drawnCard) return [];
    if (chatHistory.length > 0) return chatHistory;
    return [
      {
        id: 'vesper-prompt',
        role: 'vesper',
        text: isGenerating 
          ? "Vesper is synthesizing your daily profile resonance... Please wait." 
          : vesperPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  }, [drawnCard, isGenerating, vesperPrompt, chatHistory]);

  const preFetchCard = () => {
    const sessionId = scanSessionIdRef.current;
    
    // Choose the card immediately at 50% charge
    const randomIndex = Math.floor(Math.random() * TAROT_DECK.length);
    const card = TAROT_DECK[randomIndex];
    setDrawnCard(card);

    // Preload ASCII art immediately in parallel
    const asciiPromise = import('../../constants/asciiArt').then(asciiArtModule => {
      const art = asciiArtModule.getAsciiForCard(card.name, card.element || '');
      setAsciiArtText(art);
    }).catch(err => {
      console.error("Failed to dynamically load ASCII art:", err);
    });
    asciiPromiseRef.current = asciiPromise;

    // Fire Gemini network query in parallel
    setIsGenerating(true);
    const recentEntries = journalEntries.slice(0, 3).map(e => `[${new Date(e.timestamp).toLocaleDateString()}] Drew ${e.drawnCardName}: ${e.userEntry}`).join('\n');
    
    const promptPromise = generateDailyReflectionPrompt(card.name, card.jungianConcept, recentEntries)
      .then(prompt => {
        if (scanSessionIdRef.current === sessionId) {
          setVesperPrompt(prompt);
          setChatHistory([{
            id: crypto.randomUUID(),
            role: 'vesper',
            text: prompt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
          speakVesperTextAndWait(prompt);
        }
        return prompt;
      })
      .catch(err => {
        console.error(err);
        const fallbackPrompt = "The probability matrix has aligned on this card. What internal resonance does it stir within your immediate informational stream?";
        if (scanSessionIdRef.current === sessionId) {
          setVesperPrompt(fallbackPrompt);
          setChatHistory([{
            id: crypto.randomUUID(),
            role: 'vesper',
            text: fallbackPrompt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
          speakVesperTextAndWait(fallbackPrompt);
        }
        return fallbackPrompt;
      });
    promptPromiseRef.current = promptPromise;
  };

  const handleDraw = async () => {
    if (phase !== 'intro') return;

    // Ensure ASCII art has completed importing (started at 50% charge)
    if (asciiPromiseRef.current) {
      await asciiPromiseRef.current;
    }
    setPhase('drawn'); // Reveal card profile immediately!
    
    try {
      if (promptPromiseRef.current) {
        await promptPromiseRef.current; // Wait for Gemini query to finish if it hasn't already
      }
    } catch (e) {
      // Handled internally in promptPromise chain
    } finally {
      setIsGenerating(false);
      setPhase('writing'); // Unlock editor for operator response
    }
  };

  const startCharging = () => {
    if (phase === 'intro') {
      scanSessionIdRef.current += 1; // Increment session to cancel previous pending requests
      setIsCharging(true);
    }
  };

  const stopCharging = () => {
    setIsCharging(false);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isCharging) {
      interval = setInterval(() => {
        setCharge(prev => {
          const nextCharge = prev + 1;
          
          // Pre-fetch at 50% charge to save latency
          if (nextCharge >= 50 && !promptPromiseRef.current) {
            preFetchCard();
          }

          if (nextCharge >= 100) {
            clearInterval(interval!);
            setIsCharging(false);
            handleDraw();
            return 100;
          }
          return nextCharge;
        });
      }, 15);
    } else {
      interval = setInterval(() => {
        setCharge(prev => {
          if (prev <= 0) {
            clearInterval(interval!);
            // Clear pre-fetch state when fully discharged to prevent old card leak
            // Only reset if they aborted early (still in the intro screen)
            if (phaseRef.current === 'intro') {
              asciiPromiseRef.current = null;
              promptPromiseRef.current = null;
              setDrawnCard(null);
              setIsGenerating(false);
            }
            return 0;
          }
          return Math.max(0, prev - 2);
        });
      }, 15);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCharging]);

  const handleSave = async () => {
    if (!drawnCard || !journalInput.trim() || isClarifying) return;

    const userText = journalInput.trim();
    setJournalInput('');

    setChatHistory(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setIsClarifying(true);

    const analysis = await analyzeDailyReflection(userText, drawnCard.name, vesperPrompt);

    setIsClarifying(false);

    setChatHistory(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'vesper',
      text: analysis.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    await speakVesperTextAndWait(analysis.text);

    if (analysis.isClarificationRequest) {
      setVesperPrompt(analysis.text);
      return;
    }

    addJournalEntry({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      drawnCardName: drawnCard.name,
      vesperPrompt, // The final question they answered
      userEntry: userText
    });

    setPhase('saved');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 7, 10, 0.98)',
          backdropFilter: 'blur(15px)',
          zIndex: 5000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
          padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + var(--tabbar-total) + 12px) 16px'
        }}
      >
        {/* Style block for modal local keyframe animations */}
        <style>{`
          @keyframes modal-spin-cw {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes modal-spin-ccw {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
          @keyframes modal-pulse-glow {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.45; }
          }
          @keyframes modal-scanline-laser {
            0% { top: 0%; }
            100% { top: 100%; }
          }
          .modal-laser {
            animation: modal-scanline-laser 2s infinite linear;
          }
          .modal-spin-1 {
            animation: modal-spin-cw 20s infinite linear;
            transform-origin: center;
          }
          .modal-spin-2 {
            animation: modal-spin-ccw 14s infinite linear;
            transform-origin: center;
          }
          .modal-spin-3 {
            animation: modal-spin-cw 28s infinite linear;
            transform-origin: center;
          }
          .modal-pulse-glow {
            animation: modal-pulse-glow 3s infinite ease-in-out;
          }
        `}</style>

        <motion.div
          initial={isMobile ? { y: '100vh' } : { scale: 0.95, y: 20 }}
          animate={isMobile ? { y: 0 } : { scale: 1, y: 0 }}
          exit={isMobile ? { y: '100vh' } : { scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="glass-panel modal-panel term-border"
          style={{
            width: '100%',
            maxWidth: '480px',
            margin: '0 auto',
            height: '100%',
            maxHeight: '100%',
            boxSizing: 'border-box',
            backgroundColor: 'var(--void-black)',
            border: '2px solid var(--magi-violet)',
            boxShadow: '0 0 45px rgba(139, 92, 246, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'var(--magi-violet)',
            color: 'var(--void-black)',
            padding: '10px 15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '2px',
            fontSize: '0.8rem',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span><ScrambleText text="INDIVIDUATION PROTOCOL" duration={1} /></span>
            </div>
            {phase !== 'saved' && (
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--void-black)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                <X size={18} />
              </button>
            )}
          </div>

          {/* Content Body */}
          <div style={{
            padding: (phase === 'writing' || phase === 'drawn') ? '0px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            flex: 1,
            overflowY: 'hidden',
            position: 'relative'
          }}>
            <div className="scanline" style={{ opacity: 0.1 }} />
            
            <AnimatePresence mode="wait">
              {phase === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  style={{ textAlign: 'center', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', zIndex: 10 }}
                >
                  {/* Connected Grid Showcase Drawer */}
                  <div style={{ position: 'relative', width: '100%', height: '40vh', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    
                    {/* SVG background grid lines radiating from card */}
                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}>
                      {/* Diagonal connections */}
                      <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="rgba(139, 92, 246, 0.12)" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="90%" y1="10%" x2="10%" y2="90%" stroke="rgba(139, 92, 246, 0.12)" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="1" />
                      <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="1" />
                      
                      {/* Circular orbits */}
                      <circle cx="50%" cy="50%" r="35%" fill="none" stroke="rgba(139, 92, 246, 0.08)" strokeWidth="1" strokeDasharray="4,8" />
                      <circle cx="50%" cy="50%" r="20%" fill="none" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="1" />
                      
                      {/* Ghost Nodes */}
                      <g opacity="0.3">
                        <circle cx="20%" cy="20%" r="5" fill="none" stroke="var(--magi-violet)" strokeWidth="1" />
                        <text x="20%" y="14%" fill="var(--magi-violet)" fontSize="6px" fontFamily="monospace" textAnchor="middle">[02] SHADOW</text>
                        
                        <circle cx="80%" cy="20%" r="5" fill="none" stroke="var(--magi-violet)" strokeWidth="1" />
                        <text x="80%" y="14%" fill="var(--magi-violet)" fontSize="6px" fontFamily="monospace" textAnchor="middle">[03] ANIMA</text>
                        
                        <circle cx="20%" cy="80%" r="5" fill="none" stroke="var(--magi-violet)" strokeWidth="1" />
                        <text x="20%" y="87%" fill="var(--magi-violet)" fontSize="6px" fontFamily="monospace" textAnchor="middle">[04] SELF</text>
                        
                        <circle cx="80%" cy="80%" r="5" fill="none" stroke="var(--magi-violet)" strokeWidth="1" />
                        <text x="80%" y="87%" fill="var(--magi-violet)" fontSize="6px" fontFamily="monospace" textAnchor="middle">[05] PERSONA</text>
                      </g>
                      
                      {/* Grid metadata */}
                      <text x="50%" y="8%" fill="var(--magi-violet)" opacity="0.5" fontSize="7px" fontFamily="monospace" textAnchor="middle">[ SYS.ALIGN: COGNITIVE ]</text>
                      <text x="50%" y="95%" fill="var(--magi-violet)" opacity="0.5" fontSize="7px" fontFamily="monospace" textAnchor="middle">[ LATENT SCAN RESOLUTION: 98.4% ]</text>
                    </svg>

                    {/* Active Central Node Card (Tapped directly to collapse matrix) */}
                    <motion.div
                      whileHover={{ scale: 1.03, filter: 'brightness(1.2)' }}
                      animate={isCharging ? {
                        x: [0, (Math.random() - 0.5) * (charge / 12), (Math.random() - 0.5) * (charge / 12), 0],
                        y: [0, (Math.random() - 0.5) * (charge / 12), (Math.random() - 0.5) * (charge / 12), 0]
                      } : { x: 0, y: 0 }}
                      transition={isCharging ? {
                        duration: 0.08,
                        repeat: Infinity,
                        ease: "linear"
                      } : {}}
                      onMouseDown={startCharging}
                      onMouseUp={stopCharging}
                      onMouseLeave={stopCharging}
                      onTouchStart={(e) => { e.preventDefault(); startCharging(); }}
                      onTouchEnd={stopCharging}
                      style={{
                        width: 'clamp(180px, 40vh, 280px)',
                        aspectRatio: '2/3',
                        height: 'auto',
                        border: '2px solid var(--magi-violet)',
                        borderColor: charge > 0 
                          ? `rgb(${Math.round(139 + (255 - 139) * (charge / 100))}, ${Math.round(92 + (102 - 92) * (charge / 100))}, ${Math.round(246 + (0 - 246) * (charge / 100))})`
                          : 'var(--magi-violet)',
                        background: 'rgba(5, 7, 10, 0.95)',
                        boxShadow: isCharging 
                          ? `0 0 ${15 + (charge / 100) * 45}px rgba(255, 102, 0, ${0.15 + (charge / 100) * 0.7})` 
                          : `0 0 15px rgba(139, 92, 246, 0.1)`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 10,
                        overflow: 'hidden',
                        padding: '10px'
                      }}
                    >
                      {/* Charging progress bar inside the card */}
                      {charge > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          height: '6px',
                          width: `${charge}%`,
                          backgroundColor: 'var(--magi-orange)',
                          boxShadow: '0 0 10px var(--magi-orange)',
                          transition: 'width 0.05s linear',
                          zIndex: 5
                        }} />
                      )}

                      {/* Scanning laser line - speeds up as charge increases */}
                      <div className="modal-laser" style={{
                        position: 'absolute',
                        left: 0,
                        width: '100%',
                        height: '2px',
                        background: charge > 0 ? 'var(--magi-orange)' : 'var(--magi-violet)',
                        boxShadow: charge > 0 ? '0 0 8px var(--magi-orange)' : '0 0 8px var(--magi-violet)',
                        zIndex: 2,
                        animationDuration: isCharging ? `${Math.max(0.15, 2.0 - (charge / 100) * 1.85)}s` : '2s'
                      }} />

                      {/* Corner Brackets */}
                      <div style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, pointerEvents: 'none' }}>
                        <div className="hud-bracket" style={{ top: 0, left: 0, borderWidth: '1px 0 0 1px', borderColor: charge > 0 ? 'var(--magi-orange)' : 'var(--magi-violet)', width: '8px', height: '8px' }} />
                        <div className="hud-bracket" style={{ top: 0, right: 0, borderWidth: '1px 1px 0 0', borderColor: charge > 0 ? 'var(--magi-orange)' : 'var(--magi-violet)', width: '8px', height: '8px' }} />
                        <div className="hud-bracket" style={{ bottom: 0, left: 0, borderWidth: '0 0 1px 1px', borderColor: charge > 0 ? 'var(--magi-orange)' : 'var(--magi-violet)', width: '8px', height: '8px' }} />
                        <div className="hud-bracket" style={{ bottom: 0, right: 0, borderWidth: '0 1px 1px 0', borderColor: charge > 0 ? 'var(--magi-orange)' : 'var(--magi-violet)', width: '8px', height: '8px' }} />
                      </div>

                      {/* Node contents */}
                      <div style={{ 
                        fontSize: '0.45rem', 
                        opacity: 0.6, 
                        color: charge > 0 
                          ? `rgb(${Math.round(139 + (255 - 139) * (charge / 100))}, ${Math.round(92 + (102 - 92) * (charge / 100))}, ${Math.round(246 + (0 - 246) * (charge / 100))})`
                          : 'var(--magi-violet)', 
                        position: 'absolute', 
                        top: 8, 
                        left: 8, 
                        fontFamily: 'monospace' 
                      }}>
                        [01] INTEGRITY
                      </div>
                      
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        color: charge > 0 
                          ? `rgb(${Math.round(139 + (255 - 139) * (charge / 100))}, ${Math.round(92 + (102 - 92) * (charge / 100))}, ${Math.round(246 + (0 - 246) * (charge / 100))})`
                          : 'var(--magi-violet)', 
                        fontFamily: 'monospace' 
                      }}>
                        1
                      </div>

                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--magi-orange)', 
                        fontFamily: 'monospace', 
                        textAlign: 'center', 
                        marginTop: '25px',
                        lineHeight: '1.2'
                      }}>
                        {charge > 0 ? (
                          <div style={{ fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                            [ COGNITIVE ALIGNMENT ]<br/>
                            <span style={{ fontSize: '0.9rem', color: 'var(--magi-orange)' }}>CHARGING: {charge}%</span>
                          </div>
                        ) : (
                          <motion.div
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            style={{ fontWeight: 'bold', fontSize: 0.9 + 'rem', letterSpacing: '0.5px' }}
                          >
                            [ COLLAPSE ]<br/>
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>HOLD CORE TO REVEAL</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  <div style={{ color: 'var(--magi-violet)', marginBottom: '10px', fontSize: '0.95rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                    <ScrambleText text="Initiating Daily Scan..." duration={1.5} />
                  </div>
                  
                  <p style={{ color: 'var(--ghost-white)', opacity: 0.8, fontSize: '0.75rem', lineHeight: '1.5', fontFamily: 'monospace', maxWidth: '360px', margin: '0 auto' }}>
                    Step across the threshold. Tap and hold the central core node to charge the containment field and collapse the superposition.
                  </p>
                </motion.div>
              )}



              {(phase === 'drawn' || phase === 'writing') && drawnCard && (
                <motion.div
                  key="drawn-reflection"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0px', flex: 1, minHeight: 0, width: '100%' }}
                >
                  {/* Top Codex Display Pane (Matches active card node focus display) */}
                  <div style={{ 
                     flex: 1, 
                     border: 'none', 
                     borderBottom: '1px solid rgba(139, 92, 246, 0.25)',
                     borderRadius: '0px',
                     backgroundColor: 'var(--void-black)', 
                     display: 'flex', 
                     flexDirection: 'column', 
                     boxSizing: 'border-box', 
                     overflow: 'hidden',
                     minHeight: 0
                  }}>
                    {/* Block Header */}
                    <div style={{
                      background: 'var(--magi-violet)',
                      color: 'var(--void-black)',
                      padding: '4px 10px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      letterSpacing: '2px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexShrink: 0,
                      fontFamily: 'monospace'
                    }}>
                      <span>&gt; <ScrambleText text="CODEX" duration={1.5} /></span>
                      <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>[ SYSTEM.ARCANA ]</span>
                    </div>
                    
                    <div style={{ padding: '8px 10px 0 10px', color: 'rgba(230, 237, 243, 0.8)', fontSize: '0.72rem', fontFamily: 'monospace', lineHeight: '1.3' }}>
                      Daily scan collapsed successfully. Psychological coordinate alignment projected below:
                    </div>

                    {/* Scrollable Container */}
                    <motion.div 
                      style={{ flex: 1, overflowY: 'auto', padding: '15px' }} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ duration: 0.5 }}
                    >
                      {/* Premium ASCII Scan Profile — Full Width */}
                      <div style={{ 
                        position: 'relative', 
                        overflow: 'hidden',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        background: 'rgba(139, 92, 246, 0.05)',
                        padding: '15px 10px'
                      }}>
                        <div className="scanline" style={{ opacity: 0.15 }}></div>

                        {/* Scanline bar — bottom */}
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          height: '3px',
                          background: drawnCard.element === 'FIRE' ? 'var(--magi-orange)' : 
                                     drawnCard.element === 'EARTH' ? 'var(--bios-green)' : 
                                     drawnCard.element === 'WATER' ? '#00A8FF' :
                                     'var(--magi-violet)',
                          opacity: 0.6
                        }} />

                        {/* ASCII Art with Jungian frame — stretched to fill */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'center',
                          width: '100%',
                          overflow: 'hidden'
                        }}>
                          <ScrambledAscii 
                            className="cyber-ascii-art"
                            text={buildCardWithDirective(
                              asciiArtText,
                              drawnCard.meaning || '',
                              drawnCard.name || 'UNKNOWN',
                              drawnCard.element || ''
                            )}
                            style={{ 
                              margin: 0, 
                              color: drawnCard.element === 'FIRE' ? 'var(--magi-orange)' : 
                                     drawnCard.element === 'EARTH' ? 'var(--bios-green)' : 
                                     drawnCard.element === 'WATER' ? '#00A8FF' :
                                     'var(--magi-violet)', 
                              fontFamily: 'var(--sans, monospace)',
                              fontSize: 'clamp(0.6rem, 3.2vw, 0.85rem)',
                              lineHeight: '1.15',
                              textAlign: 'center',
                              textShadow: '0px 0px 8px rgba(139, 92, 246, 0.2)',
                              width: '100%',
                              minWidth: '100%',
                              whiteSpace: 'pre',
                              letterSpacing: '0.5px'
                            }} 
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Bottom Vesper Terminal Panel (Moved outside scrolling content) */}
                  <AnimatePresence mode="wait">
                    {(phase === 'drawn' || phase === 'writing') && drawnCard && (
                      <motion.div
                        animate={isFeedExpanded ? { flex: 1, height: 'auto' } : { flex: 'none', height: '32px' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}
                      >
                        <TerminalFrame
                          title="VESPER TERMINAL"
                          accentColor="var(--magi-violet)"
                          onHeaderClick={() => setIsFeedExpanded(!isFeedExpanded)}
                          headerActions={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6, fontSize: '0.65rem' }}>
                              {isFeedExpanded ? '[ COLLAPSE ]' : '[ EXPAND ]'}
                              {isFeedExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </span>
                          }
                          contentStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '10px 12px 8px', gap: '8px' }}
                          style={{ flex: 1, minHeight: 0, border: 'none', borderTop: '1px solid rgba(139, 92, 246, 0.25)' }}
                        >
                          <TerminalMessageList
                            messages={messages}
                            isTyping={isClarifying}
                            accentColor="var(--magi-violet)"
                            style={{ flex: 1, overflowY: 'auto', marginBottom: '8px' }}
                          />

                          {/* Operator Input Area */}
                          {!isGenerating && phase === 'writing' && (
                            <div style={{ display: 'flex', borderTop: '1px solid rgba(139, 92, 246, 0.2)', padding: '8px 4px', alignItems: 'center', gap: '6px' }}>
                              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                {!journalInput && (
                                  <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'rgba(230, 237, 243, 0.4)', fontFamily: 'monospace', fontSize: '15px' }}>
                                    <span className="terminal-orange-cursor" />
                                    <span>Enter message</span>
                                  </div>
                                )}
                                <input
                                  type="text"
                                  value={journalInput}
                                  onChange={(e) => setJournalInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                  disabled={isClarifying}
                                  style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontFamily: 'monospace',
                                    fontSize: '16px',
                                    outline: 'none',
                                    paddingLeft: '8px',
                                    caretColor: 'var(--magi-orange)'
                                  }}
                                />
                              </div>
                              {journalInput.trim() ? (
                                <motion.button 
                                  whileTap={{ scale: 0.88 }} 
                                  onClick={handleSave}
                                  style={{ 
                                    background: 'rgba(255,102,0,0.1)', 
                                    border: '1px solid var(--magi-orange)', 
                                    color: 'var(--magi-orange)', 
                                    borderRadius: '50%', 
                                    width: '32px', 
                                    height: '32px', 
                                    minWidth: '32px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    cursor: 'pointer' 
                                  }}
                                >
                                  <Send size={14} />
                                </motion.button>
                              ) : (
                                <motion.button 
                                  whileTap={{ scale: 0.88 }} 
                                  onClick={toggleListen}
                                  style={{ 
                                    background: isListening ? 'rgba(255,102,0,0.15)' : 'transparent', 
                                    border: `1px solid ${isListening ? 'var(--magi-orange)' : 'var(--magi-violet)'}`, 
                                    color: isListening ? 'var(--magi-orange)' : 'var(--magi-violet)', 
                                    borderRadius: '50%', 
                                    width: '32px', 
                                    height: '32px', 
                                    minWidth: '32px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    cursor: 'pointer' 
                                  }}
                                >
                                  <Mic size={14} />
                                </motion.button>
                              )}
                            </div>
                          )}
                        </TerminalFrame>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
              
              {phase === 'saved' && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ textAlign: 'center', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', zIndex: 10 }}
                >
                  <div style={{ color: 'var(--eva-cyan)', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                    <ScrambleText text="[ PROFILE SYNCHRONIZED ]" />
                  </div>
                  <div style={{ width: '50px', height: '50px', border: '2px solid var(--eva-cyan)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                     <div style={{ width: '10px', height: '10px', background: 'var(--eva-cyan)', borderRadius: '50%' }} />
                  </div>
                  <p style={{ color: 'var(--ghost-white)', opacity: 0.7, fontSize: '0.75rem', fontFamily: 'monospace', maxWidth: '300px', lineHeight: '1.5' }}>
                    Your cognitive coordinates have been integrated. The Individuation Matrix resonance calculation is complete.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
