// src/components/ui/ScrambleText.tsx
import { useEffect, useState, useRef } from 'react';

const GLYPHS = "010101XYZΩΨΦΣ0123456789<>[]/\\|#*+@&$%".split("");

interface ScrambleTextProps {
  text: string;
  initialText?: string;
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrambleText = ({ text = '', initialText, delay = 0, duration = 1.5, className, style }: ScrambleTextProps) => {
  const [displayText, setDisplayText] = useState(initialText ?? '');
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  useEffect(() => {
    const totalDurationMs = duration * 1000;
    let cancelled = false;
    let lastFrameTime = 0;
    const fpsInterval = 1000 / 24; // 24 FPS (approx 41.6ms)
    
    const startTimeout = setTimeout(() => {
      startTimeRef.current = performance.now();
      lastFrameTime = startTimeRef.current;
      
      const tick = (now: number) => {
        if (cancelled) return;
        
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / totalDurationMs, 1);
        const timeSinceLastFrame = now - lastFrameTime;
        
        if (timeSinceLastFrame >= fpsInterval || progress === 1) {
          lastFrameTime = now;
          
          const revealIndex = Math.floor(progress * text.length);
          let nextText = text.slice(0, revealIndex);
          
          if (revealIndex < text.length) {
            const remaining = text.slice(revealIndex);
            let scrambled = '';
            for (let i = 0; i < remaining.length; i++) {
              const char = remaining[i];
              if (char === ' ' || char === '\n') {
                scrambled += char;
              } else {
                scrambled += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              }
            }
            nextText += scrambled;
          }
          
          setDisplayText(nextText);
        }
        
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      
      rafRef.current = requestAnimationFrame(tick);
    }, delay * 1000);
    
    return () => {
      cancelled = true;
      clearTimeout(startTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [text, delay, duration]);

  return (
    <span className={className} style={style}>
      {displayText || (initialText ? initialText : text.replace(/./g, ' '))}
    </span>
  );
};
