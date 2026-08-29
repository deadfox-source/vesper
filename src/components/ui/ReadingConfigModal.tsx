import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBoardStore } from '../../modules/StateManager/boardState';
import { useRealTelemetry } from '../../modules/utils/useRealTelemetry';
import { CloudRain, Moon, Compass } from 'lucide-react';

interface ConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadingConfigModal: React.FC<ConfigProps> = ({ isOpen, onClose }) => {
  const setReadingContext = useBoardStore((state) => state.setReadingContext);
  const clearBoard = useBoardStore((state) => state.clearBoard);
  const switchSpread = useBoardStore((state) => state.switchSpread);
  const activeSpreadId = useBoardStore((state) => state.activeSpreadId);
  
  const [spreadSelect, setSpreadSelect] = useState('GRID_MACRO_SYSTEM');
  const [intentQuery, setIntentQuery] = useState('');
  const env = useRealTelemetry();

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpreadSelect(activeSpreadId);
    }
  }, [isOpen, activeSpreadId]);

  if (!isOpen) return null;

  const handleStart = () => {
    if (spreadSelect !== activeSpreadId) switchSpread(spreadSelect);
    setReadingContext(true, 'Self', intentQuery, env || undefined);
    clearBoard();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(5, 7, 10, 0.95)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3000
        }}
      >
        <motion.div
          initial={{ y: 50, scale: 0.9, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          className="glass-panel schema-container"
          style={{
             padding: '40px',
             width: '90%',
             maxWidth: '450px',
             border: '1px solid rgba(0, 240, 255, 0.4)',
             display: 'flex',
             flexDirection: 'column',
             gap: '30px',
             boxShadow: '0 0 50px rgba(0, 112, 255, 0.1)',
             clipPath: 'polygon(5% 0, 95% 0, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0 95%, 0 5%)'
          }}
        >
          <h2 style={{ color: 'var(--eva-cyan)', textAlign: 'center', margin: 0, letterSpacing: '4px' }}>&lt; JOURNAL CONFIGURATION &gt;</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', fontSize: '0.85rem', fontFamily: 'monospace', marginTop: '-15px' }}>
            [ initialize atmospheric capture ]
          </p>

          {/* Environmental Telemetry Display */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', color: 'var(--ghost-white)', fontSize: '0.75rem', padding: '15px', background: 'rgba(0,112,255,0.05)', border: '1px solid rgba(0,240,255,0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloudRain size={16} /> <span>{env?.weather?.status || 'METEO: SCANNING...'}</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={16} /> <span>{env?.location?.status || 'GEO: SCANNING...'}</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
                <Moon size={16} /> <span>{env?.spaceWeather?.status || 'RESONANCE: SCANNING...'}</span>
             </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ color: 'var(--magi-violet)', fontSize: '0.8rem', fontWeight: 'bold' }}>GRID PATTERN:</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button 
                onClick={() => setSpreadSelect('GRID_MACRO_SYSTEM')}
                className="primary-shard-btn"
                style={{ 
                  flex: 1, padding: '8px', fontSize: '0.65rem',
                  border: `1px solid ${spreadSelect === 'GRID_MACRO_SYSTEM' ? 'var(--eva-cyan)' : 'rgba(0, 240, 255, 0.2)'}`,
                  background: spreadSelect === 'GRID_MACRO_SYSTEM' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  color: spreadSelect === 'GRID_MACRO_SYSTEM' ? 'var(--eva-cyan)' : 'rgba(0, 240, 255, 0.3)'
                }}
              >
                MACRO SYSTEM
              </button>
              <button 
                onClick={() => setSpreadSelect('GRID_INFILTRATION')}
                className="primary-shard-btn"
                style={{ 
                  flex: 1, padding: '8px', fontSize: '0.65rem',
                  border: `1px solid ${spreadSelect === 'GRID_INFILTRATION' ? 'var(--eva-cyan)' : 'rgba(0, 240, 255, 0.2)'}`,
                  background: spreadSelect === 'GRID_INFILTRATION' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  color: spreadSelect === 'GRID_INFILTRATION' ? 'var(--eva-cyan)' : 'rgba(0, 240, 255, 0.3)'
                }}
              >
                INFILTRATION
              </button>
              <button 
                onClick={() => setSpreadSelect('GRID_EXFILTRATION')}
                className="primary-shard-btn"
                style={{ 
                  flex: 1, padding: '8px', fontSize: '0.65rem',
                  border: `1px solid ${spreadSelect === 'GRID_EXFILTRATION' ? 'var(--eva-cyan)' : 'rgba(0, 240, 255, 0.2)'}`,
                  background: spreadSelect === 'GRID_EXFILTRATION' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  color: spreadSelect === 'GRID_EXFILTRATION' ? 'var(--eva-cyan)' : 'rgba(0, 240, 255, 0.3)'
                }}
              >
                EXFILTRATION
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ color: 'var(--eva-cyan)', fontSize: '0.8rem', fontWeight: 'bold' }}>INTENT QUERY (MANDATORY):</label>
            <textarea 
              value={intentQuery}
              onChange={(e) => setIntentQuery(e.target.value)}
              placeholder="What's the nature of your inquiry?"
              style={{
                 width: '100%',
                 height: '90px',
                 backgroundColor: 'rgba(5, 7, 10, 0.8)',
                 border: '2px solid var(--magi-orange)',
                 padding: '12px',
                 color: 'var(--ghost-white)',
                 fontFamily: 'monospace',
                 fontSize: '16px', // MUST be 16px to prevent iOS auto-zoom
                 outline: 'none',
                 appearance: 'none',
                 borderRadius: 0,
                 resize: 'none',
                 boxSizing: 'border-box',
                 boxShadow: 'inset 0 0 10px rgba(255, 102, 0, 0.2)',
                 clipPath: 'polygon(2% 0, 98% 0, 100% 15%, 100% 85%, 98% 100%, 2% 100%, 0 85%, 0 15%)'
              }}
            />
          </div>

          <button 
            onClick={handleStart} 
            disabled={!intentQuery.trim()}
            className="primary-btn" 
            style={{ 
              marginTop: '20px',
              opacity: !intentQuery.trim() ? 0.4 : 1,
              cursor: !intentQuery.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            MANIFEST GRID
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
