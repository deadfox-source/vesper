import React from 'react';
import { motion } from 'motion/react';

interface VesperAudioFeedbackProps {
  color?: string;
  active?: boolean;
}

export const VesperAudioFeedback: React.FC<VesperAudioFeedbackProps> = ({ 
  color = 'var(--vesper-blue)', 
  active = true 
}) => {
  if (!active) return null;

  return (
    <div style={{ 
      display: 'inline-flex', 
      gap: '3px', 
      alignItems: 'center', 
      height: '14px',
      padding: '0 2px'
    }}>
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [1, 2.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay }}
          style={{
            width: '2px',
            height: '8px',
            background: color,
            borderRadius: '1px',
            originY: 'center'
          }}
        />
      ))}
    </div>
  );
};
