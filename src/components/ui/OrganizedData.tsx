// src/components/ui/OrganizedData.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { glitchAudio } from '../../modules/utils/audio';

interface OrganizedDataProps {
  text: string;
  duration?: number;
  onComplete?: () => void;
}

const GLYPHS = "010101XYZΩΨΦΣ0123456789<>[]/\\|#*+".split("");

export const OrganizedData = ({ text, duration = 1500, onComplete }: OrganizedDataProps) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let iteration = 0;
    const maxIterations = 15;
    const intervalTime = duration / maxIterations;

    const interval = setInterval(() => {
      const scrambled = text
        .split('')
        .map((char, index) => {
          if (index < (iteration / maxIterations) * text.length) {
            return char;
          }
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');

      setDisplayText(scrambled);
      
      // Play a tiny click for each shift
      if (iteration % 2 === 0) glitchAudio.playGlitch('click');

      iteration++;

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsComplete(true);
        glitchAudio.playGlitch('pulse');
        if (onComplete) onComplete();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [text, duration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        fontFamily: 'monospace',
        letterSpacing: '2px',
        color: isComplete ? 'var(--eva-green)' : 'var(--magi-orange)',
        textShadow: isComplete ? '0 0 10px var(--eva-green)' : '0 0 5px var(--magi-orange)',
        transition: 'color 0.3s ease'
      }}
    >
      {displayText}
    </motion.div>
  );
};
