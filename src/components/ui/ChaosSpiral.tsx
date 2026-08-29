// src/components/ui/ChaosSpiral.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { glitchAudio } from '../../modules/utils/audio';

const GLYPHS = "010101XYZΩΨΦΣ0123456789<>[]/\\|#*+@&$%".split("");

interface GlyphProps {
  char: string;
  delay: number;
}

const SpiralGlyph = ({ char, delay }: GlyphProps) => {
  // Use constant values inside the component to prevent re-renders with new randoms
  const [data] = useState(() => {
    const radius = 200 + Math.random() * 600; // Wider start
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rot: Math.random() * 720 - 360,
      color: Math.random() > 0.8 ? 'var(--magi-orange)' : 'var(--eva-green)'
    };
  });

  return (
    <motion.div
      initial={{ 
        x: data.x, 
        y: data.y, 
        opacity: 0,
        scale: 4,
        rotate: data.rot
      }}
      animate={{ 
        x: 0, 
        y: 0, 
        opacity: [0, 1, 1, 0],
        scale: [3, 1, 0.5, 0],
        rotate: 0
      }}
      transition={{ 
        duration: 1.8, 
        delay, 
        ease: "linear"
      }}
      style={{
        position: 'absolute',
        color: data.color,
        fontFamily: 'monospace',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        pointerEvents: 'none',
        textShadow: '0 0 10px currentColor',
        willChange: 'transform, opacity'
      }}
    >
      {char}
    </motion.div>
  );
};

export const ChaosSpiral = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'chaos' | 'organized'>('chaos');
  const glyphCount = 250; // High density for the hacker feel
  
  const [glyphs] = useState(() => 
    [...Array(glyphCount)].map((_, i) => ({
      char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      delay: i * 0.01,
      id: i
    }))
  );

  useEffect(() => {
    const audioInterval = setInterval(() => {
      glitchAudio.playGlitch('click');
    }, 80);

    const timer = setTimeout(() => {
      setPhase('organized');
      clearInterval(audioInterval);
      glitchAudio.playGlitch('pulse');
      setTimeout(onComplete, 2000);
    }, 3000);

    return () => {
      clearInterval(audioInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'black'
    }}>
      {/* Background Matrix-like pulse */}
      <motion.div
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ repeat: Infinity, duration: 4 }}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle, var(--eva-green) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />

      <AnimatePresence>
        {phase === 'chaos' && (
          <div key="chaos-vortex" style={{ position: 'relative', width: '1px', height: '1px' }}>
            {glyphs.map((g) => (
              <SpiralGlyph 
                key={g.id} 
                char={g.char} 
                delay={g.delay} 
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.5, letterSpacing: '50px' }}
        animate={{ 
          opacity: phase === 'organized' ? 1 : 0, 
          scale: phase === 'organized' ? [1.2, 1] : 0.5,
          letterSpacing: phase === 'organized' ? '12px' : '50px',
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          color: 'var(--eva-green)',
          fontSize: '3rem',
          fontWeight: 'bold',
          zIndex: 10,
          textAlign: 'center',
          textShadow: '0 0 20px var(--eva-green)',
          fontFamily: 'monospace'
        }}
      >
        <span className="glitch-text">VESPER OS_</span>
        <div style={{ fontSize: '0.8rem', letterSpacing: '4px', marginTop: '10px', opacity: 0.7 }}>
          [ SYSTEM_UPLINK_STABLE ]
        </div>
      </motion.div>
    </div>
  );
};
