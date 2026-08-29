import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVesperStore } from '../../modules/StateManager/vesperStore';
import { useBoardStore } from '../../modules/StateManager/boardState';

export const SyncBar = () => {
  const { messages } = useVesperStore();
  const { vesperMood } = useBoardStore();

  const latestEmotion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].emotion) return messages[i].emotion;
    }
    return 'neutral';
  }, [messages]);

  const isNegative = latestEmotion === 'negative' || latestEmotion === 'aggressive' || vesperMood === 'agitated';
  const agencyReminder = isNegative ? "[ AGENCY REMINDER: YOU ARE IN CONTROL OF THE PRESENT MOMENT. GROUND YOURSELF. ]" : "";

  if (!isNegative) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        style={{
          background: isNegative ? 'rgba(255,102,0,0.1)' : 'rgba(0,112,255,0.05)',
          borderTop: `1px solid ${isNegative ? 'var(--magi-orange)' : 'var(--vesper-blue)'}`,
          borderBottom: `1px solid ${isNegative ? 'var(--magi-orange)' : 'var(--vesper-blue)'}`,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          color: isNegative ? 'var(--magi-orange)' : 'var(--eva-cyan)',
          letterSpacing: '1px'
        }}
      >
        <span style={{ flex: 1 }}>
        </span>
        {isNegative && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ fontWeight: 'bold' }}
          >
            {agencyReminder}
          </motion.span>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
