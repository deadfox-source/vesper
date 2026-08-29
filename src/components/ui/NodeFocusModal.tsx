import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SPREAD_LIBRARY } from '../../modules/StateManager/spreadLibrary';
import { TAROT_DECK, TAROT_DECK_MAP } from '../../constants/tarotDictionary';
import { useBoardStore } from '../../modules/StateManager/boardState';
import { useShallow } from 'zustand/react/shallow';
import { parseLexicon } from '../lexicon/LexiconTerm';
import { X, Terminal } from 'lucide-react';
import { ScrambleText } from './ScrambleText';
import { generateNodePrompt } from '../../modules/Network/geminiService';
import { speakVesperTextAndWait, clearSpeechQueue } from '../../modules/utils/vesperSpeech';

const GLYPHS = ['@', '#', '$', '%', '&', '*', '+', '?', '£', '¢', '0', '1', '\\', '/', '|', '-', '_', '<', '>'];

const ScrambledAscii: React.FC<{ text: string, className?: string, style?: React.CSSProperties }> = ({ text, className, style }) => {
  const [displayText, setDisplayText] = useState(text);
  
  useEffect(() => {
    let iteration = 0;
    const maxIterations = 25;
    
    // Quick initial scramble masking non-whitespace characters
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayText(text.split('').map(char => char === '\n' || char === ' ' ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(''));

    const interval = setInterval(() => {
      setDisplayText(() => 
        text.split('').map((char, index) => {
          // preserve layout exactly
          if (char === '\n' || char === ' ') return char;
          // progressive reveal
          if (index < (text.length / maxIterations) * iteration) {
            return char;
          }
          // still scrambling
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

/**
 * Appends Jungian archetype text as structural ASCII frame rows
 * directly onto the card art, making it part of the card design.
 */
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
    // If the slice is exactly what we need, push it directly.
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

interface ModalProps {
  nodeId: number | null;
  onClose: () => void;
  addMessage?: (role: 'user' | 'vesper', text: string) => void;
  onNodeSubmit?: (text: string, nodeId: number) => void;
  archiveNodes?: Record<number, string>;
  archiveSpreadId?: string;
  zIndex?: number;
}

export const NodeFocusModal: React.FC<ModalProps> = ({ nodeId, onClose, addMessage, onNodeSubmit, archiveNodes, archiveSpreadId, zIndex }) => {
  const {
    activeSpreadId,
    boardNodes,
    setCardToNode,
    removeCardFromNode,
    cardNotes,
    setCardNote,
    cardPrompts,
    setCardPrompt,
    spokenNodes,
    setNodeSpoken,
    isGuidedMode
  } = useBoardStore(
    useShallow((state) => ({
      activeSpreadId: state.activeSpreadId,
      boardNodes: state.nodes,
      setCardToNode: state.setCardToNode,
      removeCardFromNode: state.removeCardFromNode,
      cardNotes: state.cardNotes,
      setCardNote: state.setCardNote,
      cardPrompts: state.cardPrompts,
      setCardPrompt: state.setCardPrompt,
      spokenNodes: state.spokenNodes,
      setNodeSpoken: state.setNodeSpoken,
      isGuidedMode: state.isGuidedMode
    }))
  );

  const [manualInput, setManualInput] = useState('');
  const [previewCardName, setPreviewCardName] = useState<string | null>(null);
  const [overrideInput, setOverrideInput] = useState('');
  
  // Mobile layout detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Guided mode state
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [asciiArtText, setAsciiArtText] = useState<string>('');
  
  const resolvedSpreadId = archiveSpreadId || activeSpreadId;
  const currentSpread = SPREAD_LIBRARY[resolvedSpreadId];
  const nodeDef = currentSpread?.nodes.find((n) => n.id === nodeId);
  const assignedCardName = nodeId !== null ? (archiveNodes ? archiveNodes[nodeId] : boardNodes[nodeId]) : undefined;
  const isCompleted = assignedCardName !== undefined;
  
  const isLockedInGuided = archiveNodes ? false : (isGuidedMode && isCompleted && !cardNotes[nodeId!]);
  const activeDetailName = previewCardName || (nodeId !== null ? (archiveNodes ? archiveNodes[nodeId] : boardNodes[nodeId]) : undefined);
  const assignedCardDetails = useMemo(() => {
    return activeDetailName ? TAROT_DECK_MAP.get(activeDetailName.toUpperCase()) : undefined;
  }, [activeDetailName]);

  // Phase 4: Dynamic/lazy-load ASCII Art to reduce bundle size
  useEffect(() => {
    if (!activeDetailName) {
      setAsciiArtText('');
      return;
    }
    import('../../constants/asciiArt')
      .then((mod) => {
        const art = mod.getAsciiForCard(activeDetailName, assignedCardDetails?.element || '');
        setAsciiArtText(art);
      })
      .catch((err) => {
        console.error("Failed to dynamically import asciiArt module:", err);
      });
  }, [activeDetailName, assignedCardDetails]);

  const handleClose = useCallback(() => {
    clearSpeechQueue();
    onClose();
  }, [onClose]);

  // Keyboard navigation & accessibility handlers
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLockedInGuided) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isLockedInGuided]);

  useEffect(() => {
    if (nodeId !== null && modalRef.current) {
      // Exclude text inputs and textareas on mobile view to prevent software keyboard popup
      const selector = isMobile 
        ? 'button, [href], select, [tabindex="0"]' 
        : 'button, [href], input, select, textarea, [tabindex="0"]';
      const focusableElements = modalRef.current.querySelectorAll(selector);
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [nodeId, isMobile]);

  // Dynamic ASCII Art Loader
  useEffect(() => {
    if (activeDetailName) {
      import('../../constants/asciiArt').then(({ getAsciiForCard }) => {
        const art = getAsciiForCard(activeDetailName, assignedCardDetails?.element || '');
        setAsciiArtText(art);
      }).catch(err => {
        console.error("Failed to load ASCII art module:", err);
      });
    } else {
      setAsciiArtText('');
    }
  }, [activeDetailName, assignedCardDetails?.element]);

  // Clear search input on modal close or change of node
  useEffect(() => {
    clearSpeechQueue();
    setManualInput('');
    setIsSpeakingPrompt(false);
    setHasSpoken(false);
    setPreviewCardName(null);
    setAsciiArtText('');
  }, [nodeId]);



  useEffect(() => {
    if (archiveNodes) return;
    const activeCard = isGuidedMode ? (isCompleted ? boardNodes[nodeId!] : undefined) : previewCardName;
    const isAlreadySpoken = nodeId !== null && spokenNodes[nodeId];
    const isReadyToSpeak = activeCard && nodeId !== null && !cardNotes[nodeId!] && !isSpeakingPrompt && !hasSpoken && !isAlreadySpoken;

    if (isReadyToSpeak) {
      const announcement = `Node ${nodeId}: ${nodeDef?.title || 'Node'}. Collapsed probability: ${activeCard}.`;
      const existingPrompt = cardPrompts[nodeId];

      if (existingPrompt) {
        setIsSpeakingPrompt(true);
        setNodeSpoken(nodeId, true);
        if (addMessage) addMessage('vesper', existingPrompt);
        speakVesperTextAndWait(announcement).then(() => {
          speakVesperTextAndWait(existingPrompt).then(() => {
              setIsSpeakingPrompt(false);
              setHasSpoken(true);
          });
        });
      } else {
        setIsSpeakingPrompt(true);
        setNodeSpoken(nodeId, true);

        // Immediately speak the announcement first
        const announcementPromise = speakVesperTextAndWait(announcement);

        // Generate the personalized insight question in parallel
        generateNodePrompt(activeCard, activeSpreadId, nodeId).then(async (prompt) => {
           setCardPrompt(nodeId, prompt);
           if (addMessage) addMessage('vesper', prompt);
           
           // Queue the question to be spoken after the announcement finishes
           await announcementPromise;
           
           speakVesperTextAndWait(prompt).then(() => {
               setIsSpeakingPrompt(false);
               setHasSpoken(true);
           });
        });
      }
    }
  }, [isGuidedMode, isCompleted, previewCardName, nodeId, cardNotes, boardNodes, activeSpreadId, addMessage, isSpeakingPrompt, hasSpoken, cardPrompts, setCardPrompt, spokenNodes, setNodeSpoken, nodeDef?.title, archiveNodes]);

  const BLACK_ICE_CARDS = ["DEATH", "THE DEVIL", "THE TOWER", "TEN OF SWORDS", "NINE OF SWORDS", "THREE OF SWORDS"];
  const isBlackIce = activeDetailName ? BLACK_ICE_CARDS.includes(activeDetailName) : false;
  const isExecDisabled = isGuidedMode 
    ? ((isBlackIce && overrideInput !== 'OVERRIDE') || !hasSpoken)
    : (isBlackIce && overrideInput !== 'OVERRIDE');

  const filteredCards = useMemo(() => {
    const search = manualInput.toUpperCase().trim();
    if (search === '') return [];
    return TAROT_DECK.filter((card) => {
      return (
        card.name.toUpperCase().includes(search) || 
        (card.element && card.element.toUpperCase().includes(search)) ||
        (card.meaning && card.meaning.toUpperCase().includes(search))
      );
    });
  }, [manualInput]);

  const handlePreview = (cardName: string) => {
    setPreviewCardName(cardName);
    setIsSpeakingPrompt(false);
    setHasSpoken(false);
    setAsciiArtText('');
  };

  const handleExecutePayload = async () => {
    if (previewCardName && nodeId !== null) {
      setCardNote(nodeId, "[ DATA LOG OMITTED ]");
      setCardToNode(nodeId, previewCardName);
      setPreviewCardName(null);
      setManualInput('');
      handleClose(); // Close modal immediately so user sees the 3D flip on the table!
      
      if (onNodeSubmit) {
        onNodeSubmit("[ DATA LOG OMITTED ]", nodeId);
      }
    }
  };



  if (nodeId === null) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 'calc(var(--terminal-height, clamp(180px, 30dvh, 260px)) + var(--tabbar-total) - 12px)',
          left: 0,
          right: 0,
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          backgroundColor: 'var(--void-black)',
          padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 0 16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          zIndex: zIndex || 3500
        }}
        onClick={() => {
          if (!isLockedInGuided) {
            handleClose();
          }
        }}
      >
        <motion.div
          layoutId={`card-${nodeId}`}
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={nodeDef?.title?.toUpperCase() || 'Node Focus Modal'}
          tabIndex={-1}
          transition={{ type: "spring", damping: 25, stiffness: 350, bounce: 0.1, duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel modal-panel term-border"
          style={{
            width: '100%',
            maxWidth: '100%',
            height: '100%',
            maxHeight: '100%',
            padding: isMobile ? '8px 10px 10px 10px' : '10px',
            borderRadius: '0px',
            border: '2px solid var(--eva-cyan)',
            borderBottom: 'none',
            backgroundColor: 'var(--void-black)',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '8px' : '10px',
            boxSizing: 'border-box',
            boxShadow: 'none',
            overflow: 'hidden'
          }}
        >
          {/* Top Window Header */}
          <div style={{
            background: 'var(--eva-cyan)',
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
            <span>&gt; <ScrambleText text={nodeDef?.title?.toUpperCase() || 'NODE'} duration={1.5} /></span>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {isCompleted && !isGuidedMode && (
                <button 
                  onClick={() => {
                    removeCardFromNode(nodeId);
                    setManualInput('');
                    handleClose();
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--void-black)', fontFamily: 'monospace', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline' }}
                >
                  {isMobile ? '[ TERM ]' : '[ TERMINATE ]'}
                </button>
              )}
              {!isLockedInGuided && (
                <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: 'var(--void-black)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div style={{ padding: '0 5px', color: 'rgba(230, 237, 243, 0.8)', fontSize: '0.75rem', fontFamily: 'monospace', lineHeight: '1.3' }}>
            {parseLexicon(nodeDef?.description || '')}
          </div>

          {(isCompleted || previewCardName) ? (
            <div style={{
              flex: 1,
              backgroundColor: 'var(--void-black)',
              borderTop: '2px solid var(--eva-cyan)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'monospace',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div className="scanline" style={{ opacity: 0.15 }}></div>
              
              {/* Block Header */}
              <div style={{
                background: 'var(--eva-cyan)',
                color: 'var(--void-black)',
                padding: '4px 10px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                letterSpacing: '2px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <span>&gt; <ScrambleText text="CODEX" duration={1.5} /></span>
                <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>[ SYSTEM.ARCANA ]</span>
              </div>

              <motion.div style={{ flex: 1, overflowY: 'auto', padding: '15px' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                



                {/* Premium ASCII Scan Profile — Full Width */}
                <div style={{ 
                  marginBottom: '20px', 
                  position: 'relative', 
                  overflow: 'hidden',
                  border: '1px solid rgba(0, 112, 255, 0.3)',
                  background: 'rgba(0, 112, 255, 0.05)',
                  padding: '15px 10px'
                }}>

                  {/* Scanline bar — bottom */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    height: '3px',
                    background: assignedCardDetails?.element === 'FIRE' ? 'var(--magi-orange)' : 
                               assignedCardDetails?.element === 'EARTH' ? 'var(--bios-green)' : 
                               assignedCardDetails?.element === 'WATER' ? '#00A8FF' :
                               'var(--eva-cyan)',
                    opacity: 0.6
                  }} />

                  {/* ASCII Art with Jungian frame — stretched to fill */}
                  <motion.div 
                    animate={isBlackIce ? {
                      x: [0, -4, 4, -2, 2, 0],
                      skewX: [0, 5, -5, 2, -2, 0],
                      opacity: [1, 0.4, 0.8, 1, 0.5, 1],
                      filter: ['hue-rotate(0deg)', 'hue-rotate(-40deg)', 'hue-rotate(40deg)', 'hue-rotate(0deg)']
                    } : {}}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "linear"
                    }}
                    style={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    width: '100%',
                    overflow: 'hidden'
                  }}>
                      <ScrambledAscii 
                        className="cyber-ascii-art"
                        text={buildCardWithDirective(
                          asciiArtText,
                          assignedCardDetails?.meaning || '',
                          activeDetailName || 'UNKNOWN',
                          assignedCardDetails?.element || ''
                        )}
                        style={{ 
                          margin: 0, 
                          color: assignedCardDetails?.element === 'FIRE' ? 'var(--magi-orange)' : 
                                 assignedCardDetails?.element === 'EARTH' ? 'var(--bios-green)' : 
                                 assignedCardDetails?.element === 'WATER' ? '#00A8FF' :
                                 'var(--eva-cyan)', 
                          fontFamily: 'var(--sans, monospace)',
                          fontSize: 'clamp(0.7rem, 3.2vw, 1.25rem)',
                        lineHeight: '1.15',
                        textAlign: 'center',
                        textShadow: '0px 0px 8px rgba(0, 240, 255, 0.2)',
                        width: '100%',
                        minWidth: '100%',
                        whiteSpace: 'pre',
                        letterSpacing: '0.5px'
                      }} 
                    />
                  </motion.div>
                </div>

                {/* User reflection log feedback/review */}
                {nodeId !== null && cardNotes[nodeId] && (
                  <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    fontSize: '0.8rem',
                    lineHeight: '1.4',
                    fontFamily: 'monospace',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{
                      color: 'var(--eva-cyan)',
                      fontWeight: 'bold',
                      borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
                      paddingBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      [ REFLECTION LOG ]
                    </div>
                    {cardPrompts[nodeId] && (
                      <div>
                        <span style={{ color: 'var(--eva-cyan)', opacity: 0.6, fontWeight: 'bold' }}>VESPER QUESTION:</span>
                        <div style={{ color: 'rgba(230, 237, 243, 0.8)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                          {cardPrompts[nodeId]}
                        </div>
                      </div>
                    )}
                    {cardNotes[nodeId] && (
                      <div style={{ marginTop: '5px' }}>
                        <span style={{ color: 'var(--magi-orange)', fontWeight: 'bold' }}>OPERATOR RESPONSE:</span>
                        <div style={{ color: 'var(--ghost-white)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                          {cardNotes[nodeId]}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {!isCompleted && previewCardName && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                  {isBlackIce && (
                    <motion.div 
                      animate={{
                        x: [0, -2, 2, -1, 1, 0],
                        opacity: [1, 0.5, 0.9, 1],
                        filter: ['hue-rotate(0deg)', 'hue-rotate(20deg)', 'hue-rotate(0deg)']
                      }}
                      transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
                      style={{ 
                      padding: '10px', 
                      background: 'rgba(255, 0, 0, 0.1)', 
                      border: '1px dashed red',
                      color: 'red',
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>! BLACK ICE DETECTED: HOSTILE ARCHETYPE !</div>
                      <div>Cognitive safety protocols forbid autonomous engagement with Shadow elements. Type "OVERRIDE" to force linkage.</div>
                      <input 
                        type="text" 
                        value={overrideInput}
                        onChange={(e) => setOverrideInput(e.target.value.toUpperCase())}
                        placeholder="OVERRIDE"
                        style={{
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid red',
                          color: 'red',
                          padding: '5px',
                          outline: 'none',
                          textTransform: 'uppercase',
                          fontFamily: 'monospace',
                          width: '120px'
                        }}
                      />
                    </motion.div>
                  )}
                  <button 
                    onClick={handleExecutePayload}
                    disabled={isExecDisabled}
                    className="primary-btn holographic-border"
                    style={{
                      background: isExecDisabled ? 'rgba(255, 255, 255, 0.1)' : 'var(--magi-orange)',
                      color: 'var(--void-black)',
                      border: '1px solid var(--magi-orange)',
                      padding: '15px 20px',
                      fontFamily: 'monospace',
                      cursor: isExecDisabled ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                      width: '100%',
                      boxShadow: isExecDisabled ? 'none' : `0 0 15px ${(isBlackIce ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 102, 0, 0.4)')}`
                    }}
                  >
                    {isBlackIce ? '[ SECURE ]' : '[ EXEC ]'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>

              {/* Terminal Input */}
              <div style={{ display: 'flex', borderBottom: '2px solid var(--vesper-blue)', paddingBottom: '10px', alignItems: 'center' }}>
                <Terminal size={18} style={{ color: 'var(--vesper-blue)', marginRight: '10px' }} />
                <input 
                  type="text"
                  className="terminal-input"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="TYPE CARD NAME..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ghost-white)',
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontSize: '1.2rem',
                    flex: 1,
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              {/* Autocomplete List */}
              {filteredCards.length > 0 && (
                <div style={{ 
                  maxHeight: '180px', 
                  overflowY: 'auto', 
                  border: '2px solid var(--vesper-blue)',
                  backgroundColor: 'var(--void-black)',
                  marginTop: '10px'
                }}>
                  {filteredCards.map(card => (
                    <div 
                      key={card.name}
                      onClick={() => handlePreview(card.name)}
                      style={{ padding: '15px', borderBottom: '1px solid rgba(197, 198, 199, 0.1)', cursor: 'pointer' }}
                    >
                      <div style={{ color: 'var(--magi-orange)', fontWeight: 'bold', marginBottom: '5px' }}>{card.name}</div>
                      <div style={{ color: 'var(--magi-orange)', opacity: 0.7, fontSize: '0.8rem' }}>{card.jungianConcept}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
