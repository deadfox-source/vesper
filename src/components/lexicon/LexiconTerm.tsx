import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const LEXICON_DICTIONARY: Record<string, { military: string; occult: string }> = {
  "BLACK ICE": {
    military: "Intrusion Countermeasures Electronics. Lethal defensive grid algorithms.",
    occult: "A rapidly surfacing Shadow Archetype. Deep psychological resistance to consciousness integration."
  },
  "GRID": {
    military: "Grid structure for spatial data indexing and topological layouts.",
    occult: "The symbolic layout of Sephirot/tarot coordinates anchoring the divination ritual."
  },
  "SITREP": {
    military: "Situation Report. A report on the current status of military variables.",
    occult: "A snapshot of the present energetic alignment governing the timeline."
  },
  "SEPHIROT": {
    military: "Systemic nodes within a hierarchical data structure.",
    occult: "The 10 emanations of Kabbalistic creation through which the Infinite interacts with the physical world."
  },
  "ATZILUTH": {
    military: "Root-level administrative access. Source code.",
    occult: "The World of Emanation. The realm of pure divinity and initial archetypal sparks."
  },
  "INDIVIDUATION": {
    military: "System defragmentation and core assimilation.",
    occult: "The Jungian process of integrating the conscious and unconscious mind into a holistic Self."
  },
  "ORACLE SYNTHESIS": {
    military: "Predictive algorithmic analysis based on probabilistic telemetry.",
    occult: "The technological translation of Tarot spreads into a coherent narrative of reality."
  }
};

export const LexiconTerm: React.FC<{ term: string, children: React.ReactNode }> = ({ term, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const def = LEXICON_DICTIONARY[term.toUpperCase()];

  if (!def) return <>{children}</>;

  return (
    <span 
      style={{ position: 'relative', display: 'inline-block', cursor: 'help' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ 
        borderBottom: '1px dashed var(--eva-cyan)',
        color: 'var(--eva-cyan)',
        fontWeight: 'bold',
        paddingBottom: '1px'
      }}>
        {children}
      </span>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '120%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '280px',
              backgroundColor: 'rgba(5, 7, 10, 0.95)',
              border: '1px solid var(--eva-cyan)',
              padding: '10px',
              zIndex: 9999,
              fontFamily: 'monospace',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,240,255,0.2)'
            }}
          >
            <div style={{ color: 'var(--ghost-white)', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(0,240,255,0.3)', paddingBottom: '4px' }}>
              {'//'} {term.toUpperCase()}
            </div>
            <div style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--warning-amber)', display: 'block', fontSize: '0.65rem' }}>[ TACTICAL ]</span>
              <span style={{ color: 'var(--ghost-white)' }}>{def.military}</span>
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--magi-violet)', display: 'block', fontSize: '0.65rem' }}>[ OCCULT ]</span>
              <span style={{ color: 'var(--ghost-white)' }}>{def.occult}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const parseLexicon = (text: string) => {
  const terms = Object.keys(LEXICON_DICTIONARY);
  // Sort terms by length descending so longer terms match first
  terms.sort((a, b) => b.length - a.length);
  
  const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (terms.includes(part.toUpperCase())) {
      return <LexiconTerm key={i} term={part}>{part}</LexiconTerm>;
    }
    return part;
  });
};
