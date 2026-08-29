import React from 'react';
import { useVesperStore } from '../../modules/StateManager/vesperStore';
import { VesperAudioFeedback } from './VesperAudioFeedback';
import { Mic, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

export const VesperGlobalControls: React.FC = () => {
  const { audioOutputEnabled, toggleAudioOutput, isSpeaking } = useVesperStore();

  const iconColor = audioOutputEnabled ? 'var(--magi-orange)' : 'rgba(255, 102, 0, 0.4)';

  // Determine which icon element to render
  let iconElement;
  if (!audioOutputEnabled) {
    iconElement = <VolumeX size={14} />;
  } else if (isSpeaking) {
    iconElement = <VesperAudioFeedback color={iconColor} />;
  } else {
    iconElement = <Mic size={14} />;
  }

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={toggleAudioOutput}
      title={audioOutputEnabled ? 'Mute Vesper' : 'Unmute Vesper'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0px',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{
        fontSize: '0.45rem',
        fontFamily: 'monospace',
        letterSpacing: '1.5px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        opacity: 0.6,
        color: iconColor,
        marginBottom: '2px',
      }}>
        AUDIO
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: iconColor }}>
        {iconElement}
        <span style={{
          fontSize: '0.65rem',
          fontFamily: 'monospace',
          fontWeight: 'bold',
        }}>
          {audioOutputEnabled ? '[MUTE]' : '[MUTED]'}
        </span>
      </div>
    </motion.button>
  );
};
