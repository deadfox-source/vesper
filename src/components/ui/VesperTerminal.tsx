import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrambleText } from './ScrambleText';
import { useVesperStore } from '../../modules/StateManager/vesperStore';

const ALREADY_TYPED_MESSAGES = new WeakSet<VesperMessage>();

export interface VesperMessage {
  id?: string;
  role: 'user' | 'model' | 'vesper';
  text: string;
  emotion?: 'positive' | 'negative' | 'neutral' | 'embarrassment' | 'aggressive';
  suggestion?: {
    spreadId: string;
    spreadRationale: string;
  };
  options?: string[];
  isTemp?: boolean;
  timestamp?: string;
  synthesisData?: {
    telemetrySnapshot: string;
    inquiryTheme: string;
    narrative: string;
    finalOutcome: string;
    nodes: { prompt: string; card: string; userAnswer: string; index: number }[];
  };
}

const SPREAD_LABELS: Record<string, string> = {
  GRID_MACRO_SYSTEM: 'FULL SYSTEM SCAN · 10-NODE',
  GRID_INFILTRATION: 'QUICK INQUIRY · 3-NODE',
  GRID_EXFILTRATION: 'CHALLENGE RESOLUTION · 5-NODE',
};

const isValidSpreadStr = (str?: string): boolean => {
  if (!str) return false;
  const s = str.trim().toLowerCase();
  return s !== '' && s !== 'null' && s !== 'nil' && s !== 'undefined' && s !== 'none';
};

const normalizeForGuideCheck = (text: string) => {
  return text.toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const NORMALIZED_GUIDE_PROMPTS = new Set([
  // 6 Card drawing prompts
  normalizeForGuideCheck("Tap the illuminated node to collapse the probability matrix and draw your next card."),
  normalizeForGuideCheck("Let's explore the next node to reveal the next coordinate in the matrix."),
  normalizeForGuideCheck("Go to the flashing node and tap it to download the next layer of data."),
  normalizeForGuideCheck("Engage the active node to collapse its superposition and draw your next card."),
  normalizeForGuideCheck("Tap the next node to continue aligning the quantum data streams."),
  normalizeForGuideCheck("Select the illuminated node to inspect the next step in this spread."),

  // 2 Introductory prompts
  normalizeForGuideCheck("Tap the illuminated node to collapse the probability matrix and draw your first card."),
  normalizeForGuideCheck("Tap the illuminated node to focus your intent and select your first card."),

  // 6 Synthesis prompts
  normalizeForGuideCheck("Probability matrix is fully stabilized. All nodes have collapsed from superposition. Are you ready to compile the full synthesis report?"),
  normalizeForGuideCheck("The grid nodes are perfectly synchronized. Quantum telemetry data has crystallized. Operator, are you ready to engage the final synthesis protocol?"),
  normalizeForGuideCheck("Every node coordinate has been logged and secured. The Implicate Order is ready to project. Shall we initiate the full operations synthesis?"),
  normalizeForGuideCheck("Data streams are successfully aligned and balanced. Self-actualization pathways have crystallized. Shall I run the final synthesis calculations, Operator?"),
  normalizeForGuideCheck("All tarot node coordinates have been mapped. The probability grid is ready for final grid extraction. Are you prepared to initialize full synthesis?"),
  normalizeForGuideCheck("Occult telemetry synchronization is complete. The Individuation Matrix has locked in. Shall we initiate the compile routine for the full synthesis report?"),
  
  // Topic selection prompt
  normalizeForGuideCheck("Select a topic below or send a message to begin.")
]);

const renderVesperText = (
  text: string, 
  voiceOnlyMode: boolean = false, 
  _emotion?: string, 
  accentColor: string = 'var(--vesper-blue)',
  onLinkClick?: (url: string) => void,
  visibleChars: number = 999999,
  isLatest: boolean = false,
  showCursor: boolean = false
) => {
  if (voiceOnlyMode) return <span style={{ color: 'rgba(0,240,255,0.35)', fontStyle: 'italic' }}>[ SECURE AUDIO TRANSMISSION ]</span>;
  
  const out: React.ReactNode[] = [];
  let keyCounter = 0;
  let charCounter = 0;
  let cursorRendered = false;

  const lines = text.split(/\r?\n/);



  const blinkingCursor = (
    <span key="blink-cursor" className="terminal-blink-cursor" style={{
      display: 'inline-block',
      width: '2px',
      height: '1.2em',
      backgroundColor: accentColor,
      marginLeft: '2px',
      verticalAlign: 'bottom',
      animation: 'terminal-cursor-blink 0.8s steps(2, start) infinite'
    }} />
  );

  let inFinalOutcomeSection = false;

  lines.forEach((line, lIdx) => {
    if (line.includes('[ FINAL OUTCOME ]')) {
      inFinalOutcomeSection = true;
    }
    if (!line.trim()) {
      if (lIdx < lines.length - 1) {
        if (charCounter < visibleChars) out.push(<br key={keyCounter++} />);
        charCounter++;
      }
      return;
    }

    const parts = line.split(/([.!?]+(?:\s+|$))/g);
    const sentences: string[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      const t = parts[i] || '';
      const p = parts[i + 1] || '';
      if (t || p) sentences.push(t + p);
    }

    const TOKEN_RE = /(\[.*?\]\([^)]+\))/g;

    const parseTokens = (str: string, inheritColor: boolean): React.ReactNode[] => {
      const tParts = str.split(TOKEN_RE);
      const tOut: React.ReactNode[] = [];
      tParts.forEach((part, i) => {
        if (!part) return;
        if (i % 2 === 1) {
          // Link token
          const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
          if (linkMatch && charCounter < visibleChars) {
            let node;
            if (onLinkClick) {
              node = <a href="#" onClick={(e) => { e.preventDefault(); onLinkClick(linkMatch[2]); }} style={{ color: 'var(--eva-cyan)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>{linkMatch[1]}</a>;
            } else {
              node = <span style={{ color: 'var(--eva-cyan)', fontWeight: 'bold' }}>{linkMatch[1]}</span>;
            }
            tOut.push(<span key={keyCounter++}>{node}</span>);
          }
          const rawText = linkMatch ? linkMatch[1] : part;
          charCounter += rawText.length;
        } else {
          // Plain text
          const chars = Array.from(part);
          chars.forEach((char) => {
            if (charCounter < visibleChars) {
              tOut.push(
                <span key={keyCounter++} style={{ color: inheritColor ? 'inherit' : `color-mix(in srgb, ${accentColor} 85%, transparent)` }}>
                  {char}
                </span>
              );
            } else if (charCounter === visibleChars && showCursor && !cursorRendered) {
              tOut.push(
                <span key={keyCounter++} style={{ color: inheritColor ? 'inherit' : `color-mix(in srgb, ${accentColor} 85%, transparent)` }}>
                  {char}
                  {blinkingCursor}
                </span>
              );
              cursorRendered = true;
            }
            charCounter++;
          });
        }
      });
      return tOut;
    };

    sentences.forEach(sentence => {
      if (!sentence.trim()) {
        out.push(<span key={keyCounter++}>{sentence}</span>);
        return;
      }

      const isQuestion = sentence.includes('?');
      const isGuidePrompt = NORMALIZED_GUIDE_PROMPTS.has(normalizeForGuideCheck(sentence)) || ['Hi!', 'Hello!', 'Hey there!', 'Greetings!', 'Welcome!'].includes(sentence.trim());

      const parsed = parseTokens(sentence, isQuestion || isGuidePrompt || inFinalOutcomeSection);

      if (inFinalOutcomeSection) {
        out.push(
          <span key={keyCounter++} style={{ 
            color: 'var(--bios-green)', 
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}>
            {parsed}
          </span>
        );
      } else if (isGuidePrompt) {
        out.push(
          <span key={keyCounter++} style={{ 
            color: 'var(--bios-green)', 
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}>
            {parsed}
          </span>
        );
      } else if (isQuestion) {
        out.push(
          <span key={keyCounter++} style={{ 
            color: 'var(--eva-cyan)', 
            fontWeight: 'bold'
          }}>
            {parsed}
          </span>
        );
      } else {
        out.push(<span key={keyCounter++}>{parsed}</span>);
      }
    });

    if (lIdx < lines.length - 1) {
      if (charCounter < visibleChars) out.push(<br key={keyCounter++} />);
      charCounter++;
    }
  });

  // Render the final cursor if typing is finished and showCursor is true
  if (showCursor && !cursorRendered && isLatest) {
    out.push(blinkingCursor);
  }

  return out;
};

export interface TerminalMessageProps {
  message: VesperMessage;
  index: number;
  voiceOnlyMode?: boolean;
  accentColor?: string;
  onLinkClick?: (url: string) => void;
  onAcceptSuggestion?: (spreadId: string) => void;
  onDismissSuggestion?: (index: number) => void;
  onOptionSelect?: (option: string) => void;
  isLatest?: boolean;
  isSpeaking?: boolean;
}

export const TerminalMessage = React.memo<TerminalMessageProps>(({ 
  message, 
  index, 
  voiceOnlyMode = false,
  accentColor = 'var(--vesper-blue)',
  onLinkClick,
  onAcceptSuggestion,
  onDismissSuggestion,
  onOptionSelect,
  isLatest = false,
  isSpeaking = false
}) => {
  const isUser = message.role === 'user';
  const mainColor = isUser ? 'var(--magi-orange)' : accentColor;

  const isGlitching = message.emotion === 'aggressive' || message.emotion === 'embarrassment';

  const displayText = React.useMemo(() => {
    if (isGlitching && !isUser && !message.text.includes('[ LOGIC FAULT ]') && !message.text.includes('[ SYSTEM ERROR ]')) {
      return `[ LOGIC FAULT ]\n\n${message.text}`;
    }
    return message.text;
  }, [message.text, isGlitching, isUser]);

  const formattedTime = React.useMemo(() => {
    if (message.timestamp) {
      if (message.timestamp.includes('-')) return message.timestamp;
      const today = new Date();
      const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      return `${dateStr} ${message.timestamp}`;
    }
    const d = new Date();
    const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
    return `${dateStr} ${timeStr}`;
  }, [message.timestamp]);

  // Inject CSS Keyframes for the blinking terminal pipe cursor
  const cursorBlinkStyle = (
    <style>{`
      @keyframes terminal-cursor-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    `}</style>
  );

  // Local typewriter character counter
  const [visibleChars, setVisibleChars] = React.useState(0);
  const [typingActive, setTypingActive] = React.useState(false);

  React.useEffect(() => {
    if (isUser) {
      setVisibleChars(displayText.length);
      ALREADY_TYPED_MESSAGES.add(message);
      return;
    }

    if (!isLatest || ALREADY_TYPED_MESSAGES.has(message)) {
      setVisibleChars(displayText.length);
      ALREADY_TYPED_MESSAGES.add(message);
      return;
    }

    setVisibleChars(0);
    setTypingActive(true);

    // 65ms per character matches the cadence of his text-to-speech voice
    const charSpeed = 55;
    const interval = setInterval(() => {
      setVisibleChars(prev => {
        if (prev >= displayText.length) {
          clearInterval(interval);
          setTypingActive(false);
          ALREADY_TYPED_MESSAGES.add(message);
          return displayText.length;
        }
        return prev + 1;
      });
    }, charSpeed);

    return () => {
      clearInterval(interval);
      setTypingActive(false);
    };
  }, [message, displayText, isUser, isLatest]);

interface ParsedCardPrompt {
  nodeNum: string;
  nodeTitle: string;
  cardName: string;
  theme?: string;
  promptBody: string;
}

const parseCardPrompt = (text: string): ParsedCardPrompt | null => {
  const trimmed = text.trim();
  if (!trimmed.toLowerCase().startsWith('node #') && !trimmed.toLowerCase().startsWith('node ')) return null;

  const lines = trimmed.split(/\r?\n/);
  const header = lines[0];
  const match = header.match(/^(?:Node|NODE)\s*#?(\d+)\s*(?:\((.*?)\))?:\s*\[\s*(.*?)\s*\]/i);
  if (!match) return null;

  const nodeNum = match[1];
  const nodeTitle = match[2] ? match[2].trim().toUpperCase() : 'ACTIVE VECTOR';
  const cardName = match[3] ? match[3].trim().toUpperCase() : 'ARCHETYPE';

  const rawBody = lines.slice(1).join('\n').trim();
  if (!rawBody) {
    return { nodeNum, nodeTitle, cardName, promptBody: header };
  }

  let theme: string | undefined = undefined;
  let promptBody = rawBody;

  const colonIdx = rawBody.indexOf(':');
  if (colonIdx > 2 && colonIdx < 35) {
    const candidateTheme = rawBody.substring(0, colonIdx).trim();
    const candidatePrompt = rawBody.substring(colonIdx + 1).trim();
    if (candidatePrompt && !candidateTheme.includes('\n')) {
      theme = candidateTheme.toUpperCase();
      promptBody = candidatePrompt;
    }
  }

  return { nodeNum, nodeTitle, cardName, theme, promptBody };
};

  const parsedCard = !isUser ? parseCardPrompt(displayText) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      className={isGlitching ? 'chromatic-aberration' : ''}
    >
      <div style={{ 
        marginBottom: message.suggestion ? '12px' : '16px', 
        fontFamily: 'monospace',
        width: '100%'
      }}>
        {parsedCard ? (
          /* Stylized Card Prompt Block */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            fontFamily: 'monospace',
            lineHeight: '1.4'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--magi-orange)', fontSize: '0.75rem', fontWeight: 'bold' }}>
              <span>┌── [ NODE #{parsedCard.nodeNum} · {parsedCard.nodeTitle} ]</span>
              <span style={{ opacity: 0.35, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>──────────────────</span>
              <span style={{ marginLeft: 'auto', color: 'var(--vesper-muted)', fontSize: '0.7rem' }}>[ {formattedTime} ]</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', paddingLeft: '2px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--eva-cyan)', fontWeight: 'bold' }}>│ ARCHETYPE:</span>
              <span style={{ color: 'var(--ghost-white)', fontWeight: 'bold' }}>[ {parsedCard.cardName} ]</span>
            </div>
            {parsedCard.theme && (
              <div style={{ display: 'flex', gap: '6px', paddingLeft: '2px', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--magi-violet)', fontWeight: 'bold' }}>│ &gt; FACET:</span>
                <span style={{ color: 'rgba(230, 237, 243, 0.9)' }}>{parsedCard.theme}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '2px', marginTop: '2px' }}>
              <span style={{ color: 'var(--warning-amber)', fontSize: '0.75rem', fontWeight: 'bold' }}>│ &gt; INQUIRY VECTOR:</span>
              <div style={{ color: 'var(--ghost-white)', paddingLeft: '8px', fontSize: '0.85rem', marginTop: '2px', whiteSpace: 'pre-wrap' }}>
                {parsedCard.promptBody}
              </div>
            </div>
            <div style={{ color: 'rgba(0, 240, 255, 0.3)', fontSize: '0.7rem' }}>
              └─────────────────────────────────────────
            </div>
          </div>
        ) : isUser ? (
          /* Stylized Operator Reflection Frame */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            fontFamily: 'monospace',
            lineHeight: '1.4'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--eva-cyan)', fontSize: '0.75rem', fontWeight: 'bold' }}>
              <span>┌── [ OPERATOR ]</span>
              <span style={{ opacity: 0.35, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>──────────────────</span>
              <span style={{ marginLeft: 'auto', color: 'var(--vesper-muted)', fontSize: '0.7rem' }}>[ {formattedTime} ]</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', paddingLeft: '2px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--eva-cyan)', fontWeight: 'bold' }}>│ &gt;</span>
              <div style={{ color: 'var(--ghost-white)', whiteSpace: 'pre-wrap' }}>{displayText}</div>
            </div>
            <div style={{ color: 'rgba(0, 240, 255, 0.3)', fontSize: '0.7rem' }}>
              └─────────────────────────────────────────
            </div>
          </div>
        ) : (
          /* Standard Vesper System Message */
          <>
            <div style={{ 
              fontSize: '0.65rem', 
              color: 'rgba(0, 112, 255, 0.4)', 
              marginBottom: '6px', 
              letterSpacing: '1px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              userSelect: 'none'
            }}>
              <span style={{ color: mainColor, flexShrink: 0 }}>
                {displayText.toLowerCase().includes('archetype') || displayText.toLowerCase().includes('vector') || displayText.toLowerCase().includes('polarity') 
                  ? '· VESPER CLARIFICATION ·' 
                  : '· VESPER SYS LINK ·'}
              </span>
              <span style={{ 
                color: 'var(--vesper-blue)', 
                opacity: 1, 
                fontWeight: 'bold', 
                flexShrink: 0 
              }}>
                [ {formattedTime} ]
              </span>
              <div style={{ 
                flex: 1, 
                height: '1px', 
                background: 'linear-gradient(90deg, rgba(0,112,255,0.2) 0%, transparent 100%)'
              }} />
            </div>

            <div style={{ 
              fontSize: '0.85rem', 
              lineHeight: '1.6',
              color: 'var(--ghost-white)',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}>
              {/* SR-only text */}
              <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                {displayText.replace(/\[|\]/g, '')}
              </span>
              <div aria-hidden="true">
                {message.isTemp ? (
                  <motion.div
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                      opacity: [0.3, 0.9, 0.3]
                    }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    style={{ color: 'var(--eva-cyan)', fontWeight: 'bold', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}
                  >
                    <span>{displayText}</span>
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ marginLeft: '4px', color: 'var(--eva-cyan)' }}
                    >
                      █
                    </motion.span>
                  </motion.div>
                ) : (
                  <div>
                    {cursorBlinkStyle}
                    {renderVesperText(
                      displayText, 
                      voiceOnlyMode, 
                      message.emotion, 
                      accentColor, 
                      onLinkClick, 
                      visibleChars, 
                      isLatest, 
                      isSpeaking || typingActive
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>

      {/* Inline Reading Suggestion (Standardized & Space Conscious) */}
      <AnimatePresence>
        {message.suggestion && isValidSpreadStr(message.suggestion.spreadId) && onAcceptSuggestion && onDismissSuggestion && (
          <motion.div 
            key={`sug-${index}`} 
            initial={{ opacity: 0, y: 6 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.97 }}
            style={{ margin: '6px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--magi-orange)', fontFamily: 'monospace', fontWeight: 'bold' }}>
              &gt; SPREAD RECOM: [ {SPREAD_LABELS[message.suggestion.spreadId] || message.suggestion.spreadId} ]
            </div>
            {isValidSpreadStr(message.suggestion.spreadRationale) && (
              <div style={{ fontSize: '0.75rem', color: 'rgba(230,237,243,0.8)', fontFamily: 'monospace', lineHeight: '1.3' }}>
                {message.suggestion.spreadRationale}
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              <motion.button 
                whileTap={{ scale: 0.96 }} 
                onClick={() => onDismissSuggestion(index)}
                style={{ height: '32px', padding: '0 12px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.25)', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                whileHover={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}
              >
                [ DECLINE ]
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.96 }} 
                onClick={() => onAcceptSuggestion(message.suggestion!.spreadId)}
                style={{ height: '32px', padding: '0 12px', background: 'var(--eva-cyan)', border: '1px solid var(--eva-cyan)', color: 'var(--void-black)', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                whileHover={{ opacity: 0.9 }}
              >
                [ DEPLOY SPREAD ]
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Selection Menu Options (Standardized & Space Conscious) */}
      <AnimatePresence>
        {isLatest && !typingActive && !isSpeaking && message.options && message.options.length > 0 && onOptionSelect && (
          <motion.div 
            key={`opts-${index}`} 
            initial={{ opacity: 0, y: 6 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}
          >
            {message.options.filter(isValidSpreadStr).map((option: string, optIdx: number) => (
              <motion.button
                key={`opt-${optIdx}`}
                whileTap={{ scale: 0.96 }}
                onClick={() => onOptionSelect(option)}
                style={{
                  height: '32px',
                  background: 'transparent',
                  border: '1px solid var(--eva-cyan)',
                  color: 'var(--eva-cyan)',
                  padding: '0 10px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.2s, color 0.2s',
                  whiteSpace: 'nowrap'
                }}
                whileHover={{
                  background: 'rgba(0, 240, 255, 0.15)'
                }}
              >
                <span style={{ color: 'var(--magi-orange)' }}>&gt;</span>
                {option}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Deep comparison to prevent redundant re-renders of messages in history
  if (prevProps.isLatest !== nextProps.isLatest) return false;
  if (prevProps.voiceOnlyMode !== nextProps.voiceOnlyMode) return false;
  if (prevProps.accentColor !== nextProps.accentColor) return false;
  if (prevProps.message !== nextProps.message) return false;
  if (prevProps.isSpeaking !== nextProps.isSpeaking) return false;

  return true;
});

export interface TerminalMessageListProps {
  messages: VesperMessage[];
  isTyping?: boolean;
  voiceOnlyMode?: boolean;
  accentColor?: string;
  onLinkClick?: (url: string) => void;
  onAcceptSuggestion?: (spreadId: string) => void;
  onDismissSuggestion?: (index: number) => void;
  onOptionSelect?: (option: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const TerminalMessageList: React.FC<TerminalMessageListProps> = ({ 
  messages, 
  isTyping = false, 
  voiceOnlyMode = false,
  accentColor = 'var(--vesper-blue)',
  onLinkClick,
  onAcceptSuggestion,
  onDismissSuggestion,
  onOptionSelect,
  className = "custom-scrollbar",
  style
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const isSpeaking = useVesperStore(state => state.isSpeaking);

  const prevMsgLength = React.useRef(messages.length);

  // Setup MutationObserver to snap-scroll when content grows (typewriter or incoming texts)
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMutation = () => {
      // On mobile, text wraps a lot. Increase threshold to 300px.
      const threshold = 300; // px
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
      
      // Always scroll to bottom if there's an active typing animation or we're near bottom
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    };

    const observer = new MutationObserver(handleMutation);
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Initial snapped bottom position
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);

    return () => observer.disconnect();
  }, []);

  // Snap-scroll instantly on new messages added or user active typing
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (messages.length > prevMsgLength.current || isTyping) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);

      // Additional delayed scrolls to handle the suggestion box animation
      if (messages[messages.length - 1]?.suggestion) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 150);
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 350);
      }
    }
    prevMsgLength.current = messages.length;
  }, [messages, isTyping]);

  return (
    <div ref={scrollContainerRef} className={className} role="log" aria-live="polite" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
      {messages.map((msg, idx) => {
        const uniqueKey = msg.id || `${msg.role}-${msg.text.substring(0, 16)}-${idx}`;
        return (
          <TerminalMessage 
            key={uniqueKey} 
            message={msg} 
            index={idx} 
            voiceOnlyMode={voiceOnlyMode} 
            accentColor={accentColor}
            onLinkClick={onLinkClick}
            onAcceptSuggestion={onAcceptSuggestion}
            onDismissSuggestion={onDismissSuggestion}
            onOptionSelect={onOptionSelect}
            isSpeaking={isSpeaking}
            isLatest={idx === messages.length - 1}
          />
        );
      })}
    </div>
  );
};

export interface TerminalFrameProps {
  title: string;
  titleDuration?: number;
  accentColor?: string;
  headerColor?: string;
  headerActions?: React.ReactNode;
  headerSubtitle?: React.ReactNode;
  onHeaderClick?: () => void;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

export const TerminalFrame: React.FC<TerminalFrameProps> = ({
  title,
  titleDuration = 1.5,
  accentColor = 'var(--vesper-blue)',
  headerColor,
  headerActions,
  headerSubtitle,
  onHeaderClick,
  children,
  className = '',
  contentClassName = 'custom-scrollbar',
  style,
  contentStyle
}) => {
  const finalHeaderColor = headerColor || accentColor;
  
  return (
    <div 
      className={className} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'hidden', 
        minHeight: 0,
        border: `2px solid ${accentColor}`,
        background: 'var(--void-black)',
        borderRadius: '0px',
        width: '100%',
        position: 'relative',
        ...style 
      }}
    >
      <div 
        onClick={onHeaderClick}
        style={{ 
          background: finalHeaderColor,
          color: 'var(--void-black)',
          padding: '4px 10px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          fontFamily: 'monospace',
          cursor: onHeaderClick ? 'pointer' : 'default',
          userSelect: 'none'
        }}
      >
        <span>&gt; <ScrambleText text={title} duration={titleDuration} /></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {headerSubtitle && <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>{headerSubtitle}</span>}
          {headerActions}
        </div>
      </div>
      
      {/* Container for content block */}
      <div className={contentClassName} style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', touchAction: 'pan-y', gap: '10px', backgroundColor: 'var(--void-black)', minHeight: 0, ...contentStyle }}>
        {children}
      </div>
    </div>
  );
};
