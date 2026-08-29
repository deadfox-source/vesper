import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { ScrambleText } from './ScrambleText';
import { TAROT_DECK_MAP } from '../../constants/tarotDictionary';
import { TerminalFrame, TerminalMessageList, type VesperMessage } from './VesperTerminal';
import type { JournalEntry } from '../../modules/StateManager/profileStore';

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
    
    setTimeout(() => {
      setDisplayText(text.split('').map(char => char === '\n' || char === ' ' ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(''));
    }, 0);

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

interface JournalDetailModalProps {
  entry: JournalEntry;
  onClose: () => void;
}

export const JournalDetailModal = ({ entry, onClose }: JournalDetailModalProps) => {
  const [asciiArtText, setAsciiArtText] = useState<string>('');
  const [isFeedExpanded, setIsFeedExpanded] = useState(true);

  const assignedCardDetails = useMemo(() => {
    return TAROT_DECK_MAP.get(entry.drawnCardName.toUpperCase());
  }, [entry.drawnCardName]);

  useEffect(() => {
    import('../../constants/asciiArt')
      .then((mod) => {
        const art = mod.getAsciiForCard(entry.drawnCardName, assignedCardDetails?.element || '');
        setAsciiArtText(art);
      })
      .catch((err) => {
        console.error("Failed to dynamically load ASCII art:", err);
      });
  }, [entry.drawnCardName, assignedCardDetails]);

  const messages = useMemo<VesperMessage[]>(() => {
    return [
      {
        id: 'vesper-prompt',
        role: 'vesper',
        text: entry.vesperPrompt,
        timestamp: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'user-entry',
        role: 'user',
        text: entry.userEntry,
        timestamp: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  }, [entry]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 7, 10, 0.98)',
          backdropFilter: 'blur(15px)',
          zIndex: 5000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px 20px'
        }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="terminal-frame"
          style={{
            width: '100%',
            maxWidth: '480px',
            height: '100%',
            maxHeight: '100%',
            backgroundColor: 'var(--void-black)',
            border: 'none',
            boxShadow: 'none',
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
              <BookOpen size={16} />
              <span><ScrambleText text="VESPER ARCHIVE REFLECTION" duration={1} /></span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--void-black)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <X size={18} />
            </button>
          </div>

          {/* Content Body */}
          <div style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            flex: 1,
            overflowY: 'hidden',
            position: 'relative'
          }}>
            <div className="scanline" style={{ opacity: 0.1 }} />

            {/* Top Codex Display Pane */}
            <div style={{ 
              flex: 1, 
              border: '2px solid var(--magi-violet)', 
              borderBottom: 'none',
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
                Archived record loaded successfully. Psychological coordinate alignment projected below:
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
                    background: assignedCardDetails?.element === 'FIRE' ? 'var(--magi-orange)' : 
                               assignedCardDetails?.element === 'EARTH' ? 'var(--bios-green)' : 
                               assignedCardDetails?.element === 'WATER' ? '#00A8FF' :
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
                    {asciiArtText && (
                      <ScrambledAscii 
                        className="cyber-ascii-art"
                        text={buildCardWithDirective(
                          asciiArtText,
                          assignedCardDetails?.meaning || '',
                          entry.drawnCardName || 'UNKNOWN',
                          assignedCardDetails?.element || ''
                        )}
                        style={{ 
                          margin: 0, 
                          color: assignedCardDetails?.element === 'FIRE' ? 'var(--magi-orange)' : 
                                 assignedCardDetails?.element === 'EARTH' ? 'var(--bios-green)' : 
                                 assignedCardDetails?.element === 'WATER' ? '#00A8FF' :
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
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Vesper Terminal Panel */}
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
                style={{ flex: 1, minHeight: 0 }}
              >
                <TerminalMessageList
                  messages={messages}
                  accentColor="var(--magi-violet)"
                  style={{ flex: 1, overflowY: 'auto', marginBottom: '8px' }}
                />

                {/* Dismiss Button Area */}
                <div style={{ display: 'flex', borderTop: '1px solid rgba(139, 92, 246, 0.2)', padding: '8px 4px 4px', justifyContent: 'center' }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                      background: 'rgba(139, 92, 246, 0.05)',
                      border: '1px solid var(--magi-violet)',
                      color: 'var(--magi-violet)',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      letterSpacing: '2px',
                      width: '100%',
                      textAlign: 'center',
                      borderRadius: '0px'
                    }}
                    whileHover={{ background: 'var(--magi-violet)', color: 'var(--void-black)' }}
                  >
                    [ DISMISS ]
                  </motion.button>
                </div>
              </TerminalFrame>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
