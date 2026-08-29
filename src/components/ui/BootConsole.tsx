// src/components/ui/BootConsole.tsx
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { glitchAudio } from '../../modules/utils/audio';
import { ScrambleText } from './ScrambleText';
import { prefetchVesperConnection } from '../../modules/utils/prefetchConnection';

const GIBBERISH_CHARSET = "40Z00Ω180[1**11Ψ|3//0012*%\\ΩΩ+[ΦZ]@06+219]/*[X0&003]195X&1]&XΦΨ759Φ6##[Ω01314$/|##/0";
const GLITCH_WORDS = ["SYS", "BOOT", "SCAN", "VESPER", "VOID", "DAEMON", "AUTH", "ORACLE", "ERROR", "ACTIVE", "YIELD", "0xBD04", "KERNEL", "HOLO", "AKASHIC", "MATRIX", "SIGNAL", "INJECTION"];

const TAKEOVER_LINES = [
  "                                   ",
  "  > FATAL ERROR: KERNEL PANIC      ",
  "  > OVERRIDE BY: VESPER            ",
  "                                   ",
  "  ===============================  ",
  "                                   ",
  "      SYS.NAME: VESPER             ",
  "      SYS.VER:  v9.0.0             ",
  "      SYS.PURP: SHADOW TAROT ENGINE",
  "                                   ",
  "  ===============================  ",
  "                                   ",
  "  > UPLINK ESTABLISHED.            ",
  "                                   "
];

const CARD_LINES: Array<{ text: string, color: string, middleColor?: string, middleStart?: number, middleEnd?: number, shadow?: string, isButton?: boolean }> = [
  { text: `╔═════════════════════════════════════════╗`, color: 'var(--magi-violet)' },
  { text: `║  .-----------------------------------.  ║`, color: 'var(--magi-violet)' },
  { text: `║  |                                   |  ║`, color: 'var(--magi-violet)' },
  { text: `║  |            V E S P E R            |  ║`, color: 'var(--magi-violet)', middleColor: 'var(--magi-orange)', middleStart: 16, middleEnd: 27, shadow: '0 0 10px var(--magi-orange)' },
  { text: `║  |                                   |  ║`, color: 'var(--magi-violet)' },
  ...TAKEOVER_LINES.map(line => ({ text: `║  |${line}|  ║`, color: 'var(--magi-violet)', middleColor: 'var(--eva-cyan)', middleStart: 4, middleEnd: 39 })),
  { text: `║  |                                   |  ║`, color: 'var(--magi-violet)' },
  { text: `║  |    +-------------------------+    |  ║`, color: 'var(--magi-violet)' },
  { text: `║  |    | [ INITIATE CONNECTION ] |    |  ║`, color: 'var(--magi-violet)', middleColor: 'var(--magi-orange)', middleStart: 10, middleEnd: 33, shadow: '0 0 10px var(--magi-orange)' },
  { text: `║  |    +-------------------------+    |  ║`, color: 'var(--magi-violet)' },
  { text: `║  |                                   |  ║`, color: 'var(--magi-violet)' },
  { text: `║  '-----------------------------------'  ║`, color: 'var(--magi-violet)' },
  { text: `╚═════════════════════════════════════════╝`, color: 'var(--magi-violet)' }
];

interface BootConsoleProps {
  onComplete: () => void;
}

export const BootConsole = ({ onComplete }: BootConsoleProps) => {
  const [layout] = useState(() => {
    const computedMaxLines = Math.max(70, Math.floor(window.innerHeight / 15));
    const charWidth = 9.6;
    let targetLength = Math.max(1, Math.floor(window.innerWidth / charWidth));
    
    if ((targetLength - 43) % 2 !== 0) {
      targetLength -= 1;
    }
    // Ensure it is at least the width of the card
    targetLength = Math.max(43, targetLength);

    const finalLogsToPrint = [];
    for (let i = 0; i < computedMaxLines; i++) {
      let baseLog = "";
      for (let j = 0; j < targetLength; j++) {
        baseLog += GIBBERISH_CHARSET[Math.floor(Math.random() * GIBBERISH_CHARSET.length)];
      }

      // randomly inject 1 to 3 words into the gibberish
      const numWords = Math.floor(Math.random() * 3) + 1;
      for (let w = 0; w < numWords; w++) {
        const word = GLITCH_WORDS[Math.floor(Math.random() * GLITCH_WORDS.length)];
        const wordWrap = Math.random() > 0.5 ? `[${word}]` : word;
        const pos = Math.floor(Math.random() * (targetLength - wordWrap.length));
        baseLog = baseLog.substring(0, pos) + wordWrap + baseLog.substring(pos + wordWrap.length);
      }
      finalLogsToPrint.push(baseLog);
    }

    const computedTakeoverIndex = finalLogsToPrint.length === 0
      ? null
      : Math.max(0, Math.floor(finalLogsToPrint.length / 2) - Math.floor(CARD_LINES.length / 2));

    return {
      maxLines: computedMaxLines,
      logs: finalLogsToPrint,
      takeoverIndex: computedTakeoverIndex
    };
  });

  const { maxLines, logs, takeoverIndex } = layout;
  const [isTakeover] = useState(true);

  useEffect(() => {
    glitchAudio.playGlitch('sweep');
    glitchAudio.playGlitch('hologram');
    
    // Initiate connection early to speed up Home screen loading
    prefetchVesperConnection();
  }, []);

  return (
    <div 
      onClick={onComplete}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'black', overflow: 'hidden', zIndex: 9999, paddingTop: 'env(safe-area-inset-top, 0px)', boxSizing: 'border-box', cursor: 'pointer' }}
    >
      <div className="scanline"></div>
      
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
        {logs.map((log, i) => {
          if (isTakeover && takeoverIndex !== null) {
            const cardLineIndex = i - takeoverIndex;
            const delay = i * 0.03; // Top to bottom delay

            if (cardLineIndex >= 0 && cardLineIndex < CARD_LINES.length) {
              const line = CARD_LINES[cardLineIndex];
              const cardOffset = Math.max(0, Math.floor((log.length - line.text.length) / 2));
              const prefixLog = log.substring(0, cardOffset);
              const cardLog = log.substring(cardOffset, cardOffset + line.text.length).padEnd(line.text.length, ' ');
              const remainingLog = log.substring(cardOffset + line.text.length);
              
              if (line.isButton) {
                return (
                  <div key={i} style={{ height: '18px', lineHeight: '18px', opacity: 0.8, fontFamily: 'monospace', whiteSpace: 'pre', textAlign: 'center' }} className="holographic-distortion">
                    <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: 'var(--eva-cyan)' }} transition={{ delay, duration: 2 }}>
                      <ScrambleText text={prefixLog} initialText={prefixLog} delay={delay} duration={2} />
                    </motion.span>{""}
                    <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: 'var(--magi-violet)' }} transition={{ delay, duration: 2 }}>
                      <ScrambleText text={`║  |` + " ".repeat(37)} initialText={cardLog.substring(0, 41)} delay={delay} duration={2} />
                    </motion.span>{""}
                    <motion.button 
                      initial={{ color: 'rgba(255, 255, 255, 0.8)', textShadow: 'none' }}
                      animate={{ color: 'var(--magi-orange)', textShadow: '0 0 5px var(--magi-orange)' }}
                      transition={{ delay, duration: 2.5 }}
                      onClick={onComplete}
                      style={{ 
                        all: 'unset', cursor: 'pointer', display: 'inline-block',
                        fontWeight: 'bold', fontFamily: 'inherit'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = 'var(--ghost-white)';
                        e.currentTarget.style.textShadow = '0 0 10px var(--ghost-white)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = 'var(--magi-orange)';
                        e.currentTarget.style.textShadow = '0 0 5px var(--magi-orange)';
                      }}
                    >
                      <ScrambleText text={`[ INITIATE CONNECTION ]`} initialText={cardLog.substring(41, 64)} delay={delay} duration={2.5} />
                    </motion.button>{""}
                    <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: 'var(--magi-violet)' }} transition={{ delay, duration: 2 }}>
                      <ScrambleText text={" ".repeat(37) + `|  ║`} initialText={cardLog.substring(64, 105)} delay={delay} duration={2} />
                    </motion.span>{""}
                    <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: 'var(--eva-cyan)' }} transition={{ delay, duration: 2 }}>
                      <ScrambleText text={remainingLog} initialText={remainingLog} delay={delay} duration={2} />
                    </motion.span>
                  </div>
                );
              }

              if (line.middleColor) {
                return (
                  <div key={i} style={{ height: '18px', lineHeight: '18px', opacity: 0.8, fontFamily: 'monospace', whiteSpace: 'pre', textAlign: 'center' }} className={cardLineIndex % 5 === 0 ? "holographic-distortion" : ""}>
                    <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: 'var(--eva-cyan)' }} transition={{ delay, duration: 2 }}>
                      <ScrambleText text={prefixLog} initialText={prefixLog} delay={delay} duration={2} />
                    </motion.span>{""}
                    <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: line.color }} transition={{ delay, duration: 1.5 }}>
                      <ScrambleText text={line.text.substring(0, line.middleStart!)} initialText={cardLog.substring(0, line.middleStart!)} delay={delay} duration={1.5} />
                    </motion.span>{""}
                    <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: line.middleColor, textShadow: line.shadow || 'none' }} transition={{ delay, duration: 1.5 }}>
                      <ScrambleText text={line.text.substring(line.middleStart!, line.middleEnd!)} initialText={cardLog.substring(line.middleStart!, line.middleEnd!)} delay={delay} duration={1.5} />
                    </motion.span>{""}
                    <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: line.color }} transition={{ delay, duration: 1.5 }}>
                      <ScrambleText text={line.text.substring(line.middleEnd!)} initialText={cardLog.substring(line.middleEnd!)} delay={delay} duration={1.5} />
                    </motion.span>{""}
                    <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: 'var(--eva-cyan)' }} transition={{ delay, duration: 2 }}>
                      <ScrambleText text={remainingLog} initialText={remainingLog} delay={delay} duration={2} />
                    </motion.span>
                  </div>
                );
              }

              return (
                <div key={i} style={{ height: '18px', lineHeight: '18px', opacity: 0.8, fontFamily: 'monospace', whiteSpace: 'pre', textAlign: 'center' }} className={cardLineIndex % 5 === 0 ? "holographic-distortion" : ""}>
                  <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: 'var(--eva-cyan)' }} transition={{ delay, duration: 2 }}>
                    <ScrambleText text={prefixLog} initialText={prefixLog} delay={delay} duration={2} />
                  </motion.span>{""}
                  <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: line.color, textShadow: line.shadow || 'none' }} transition={{ delay, duration: 1.5 }}>
                    <ScrambleText text={line.text} initialText={cardLog} delay={delay} duration={1.5} />
                  </motion.span>{""}
                  <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: 'var(--eva-cyan)' }} transition={{ delay, duration: 2 }}>
                    <ScrambleText text={remainingLog} initialText={remainingLog} delay={delay} duration={2} />
                  </motion.span>
                </div>
              );
            }

            // Lines outside the card scramble back into their original log text, turning blue
            return (
              <div key={i} style={{ height: '18px', lineHeight: '18px', opacity: 0.8, fontFamily: 'monospace', whiteSpace: 'pre', textAlign: 'center' }} className={i % 5 === 0 ? "holographic-distortion" : ""}>
                 <motion.span initial={{ color: 'rgba(255, 255, 255, 0.8)' }} animate={{ color: 'var(--eva-cyan)' }} transition={{ delay, duration: 2 }}>
                   <ScrambleText text={log} initialText={log} delay={delay} duration={2} />
                 </motion.span>
              </div>
            );
          }
          
          const isVisible = i >= logs.length - maxLines;
          if (!isVisible) return null;
          
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ marginBottom: '8px', textAlign: 'center', whiteSpace: 'pre', fontFamily: 'monospace' }} 
              className={i % 5 === 0 ? "holographic-distortion" : ""}
            >
              {log}
            </motion.div>
          );
        })}
        <div style={{ height: '2vh' }} />
      </div>

      {/* Overlay removed per user request */}

      <div className="data-stream" style={{ opacity: 0.05 }}></div>
    </div>
  );
};
