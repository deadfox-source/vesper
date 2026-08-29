import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield } from 'lucide-react';
import type { VesperRecord } from '../../modules/StateManager/recordStore';
import { TAROT_DECK_MAP } from '../../constants/tarotDictionary';
import { SPREAD_LIBRARY } from '../../modules/StateManager/spreadLibrary';
import { TerminalFrame } from './VesperTerminal';
import { NodeFocusModal } from './NodeFocusModal';

interface RecordDetailModalProps {
  record: VesperRecord | null;
  onClose: () => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'NODES'>('OVERVIEW');
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);

  // Calculate elements dynamically based on drawn cards in record.nodes
  const elementScores = useMemo(() => {
    const scores = { FIRE: 0, WATER: 0, EARTH: 0, AIR: 0 };
    if (!record) return scores;
    Object.values(record.nodes).forEach(cardName => {
      const info = TAROT_DECK_MAP.get(cardName.toUpperCase());
      if (info && info.element) {
        const el = info.element.toUpperCase();
        if (el in scores) {
          scores[el as keyof typeof scores] += 1;
        }
      }
    });
    return scores;
  }, [record]);

  if (!record) return null;

  const spreadDef = SPREAD_LIBRARY[record.spreadId];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 7, 10, 0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px 20px'
        }}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="record-detail-panel term-border"
          style={{
            width: '100%',
            maxWidth: '550px',
            height: 'calc(100vh - 10dvh - var(--tabbar-total))',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            backgroundColor: 'var(--void-black)',
            overflow: 'hidden'
          }}
        >
          <div className="scanline" style={{ opacity: 0.1 }} />

          <TerminalFrame 
             title="SYNTHESIS RESULTS" 
             headerActions={
               <motion.button 
                 whileHover={{ rotate: 90, scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
                 onClick={onClose}
                 style={{ background: 'transparent', border: 'none', color: 'var(--eva-cyan)', cursor: 'pointer', padding: 0 }}
               >
                 <X size={20} />
               </motion.button>
             }
             contentStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px', gap: '14px' }}
             style={{ flex: 1, minHeight: 0 }}
          >
             {/* Toggle tabs for top dashboard panel */}
             <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', flexShrink: 0 }}>
               {['OVERVIEW', 'NODES & REFLECTIONS'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab === 'OVERVIEW' ? 'OVERVIEW' : 'NODES')}
                   style={{
                     flex: 1,
                     background: (activeTab === 'OVERVIEW' && tab === 'OVERVIEW') || (activeTab === 'NODES' && tab === 'NODES & REFLECTIONS') ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                     border: 'none',
                     color: (activeTab === 'OVERVIEW' && tab === 'OVERVIEW') || (activeTab === 'NODES' && tab === 'NODES & REFLECTIONS') ? 'var(--eva-cyan)' : 'var(--ghost-white)',
                     padding: '10px',
                     cursor: 'pointer',
                     fontFamily: 'monospace',
                     fontWeight: 'bold',
                     fontSize: '0.75rem',
                     letterSpacing: '1px',
                     borderBottom: (activeTab === 'OVERVIEW' && tab === 'OVERVIEW') || (activeTab === 'NODES' && tab === 'NODES & REFLECTIONS') ? '2px solid var(--eva-cyan)' : 'none',
                     transition: 'none'
                   }}
                 >
                   [ {tab} ]
                 </button>
               ))}
             </div>

             {/* Scrollable dashboard content - styled exactly like synthesis overview */}
             <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {activeTab === 'OVERVIEW' ? (
                  <>
                    {/* Date Metadata Accent */}
                    <div style={{ padding: '10px 12px', borderLeft: '3px solid var(--magi-violet)', background: 'rgba(139, 92, 246, 0.04)', fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--ghost-white)' }}>
                       <span style={{ color: 'var(--magi-violet)', fontWeight: 'bold' }}>RECORD TIMESTAMP:</span> {new Date(record.timestamp).toLocaleString().toUpperCase()}
                    </div>

                    {record.query && (
                      <div style={{ padding: '10px 12px', border: '1px solid var(--eva-cyan)', background: 'rgba(0, 240, 255, 0.03)', color: 'var(--eva-cyan)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        [ OPERATOR INQUIRY: "{record.query.toUpperCase()}" ]
                      </div>
                    )}

                    {/* High Density 2-Column Grid: Elements & Telemetry */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      {/* Elements Column */}
                      <div style={{ padding: '12px', border: '1px solid rgba(0, 240, 255, 0.15)', background: 'rgba(0, 240, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--eva-cyan)', fontWeight: 'bold', letterSpacing: '1px' }}>ELEMENTS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {Object.entries(elementScores).map(([el, score]) => (
                            <div key={el} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <div style={{ width: '40px', fontSize: '0.6rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{el}</div>
                               <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                                  <div 
                                    style={{ 
                                      height: '100%', 
                                      width: `${Math.min(100, (score / 4) * 100)}%`,
                                      background: el === 'FIRE' ? 'var(--magi-orange)' : 
                                                 el === 'WATER' ? 'var(--vesper-blue)' : 
                                                 el === 'EARTH' ? 'var(--bios-green)' : 'var(--magi-violet)' 
                                    }}
                                  />
                               </div>
                               <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', width: '12px', textAlign: 'right' }}>{score}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Telemetry Column */}
                      <div style={{ border: '1px solid rgba(0, 240, 255, 0.15)', padding: '12px', background: 'rgba(0, 240, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                        <div style={{ color: 'var(--eva-cyan)', fontWeight: 'bold', fontSize: '0.65rem', letterSpacing: '1px' }}>TELEMETRY</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          <span style={{ opacity: 0.7 }}>METEO:</span>
                          <span style={{ color: 'var(--ghost-white)' }}>STABLE</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          <span style={{ opacity: 0.7 }}>GEO:</span>
                          <span style={{ color: 'var(--ghost-white)' }}>COHERENT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          <span style={{ opacity: 0.7 }}>RESONANCE:</span>
                          <span style={{ color: 'var(--ghost-white)' }}>7.83Hz</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          <span style={{ opacity: 0.7 }}>K-INDEX:</span>
                          <span style={{ color: 'var(--bios-green)' }}>1 (NORM)</span>
                        </div>
                      </div>
                    </div>

                    {/* Full Final Synthesis Report Text Block */}
                    <div style={{ border: '1px solid var(--eva-cyan)', padding: '15px', background: 'rgba(0, 240, 255, 0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--eva-cyan)', fontWeight: 'bold', letterSpacing: '1px' }}>[ QUANTUM GRID SYNTHESIS ]</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ghost-white)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {record.synthesis.replace(/\[\s*NODE_BREAKDOWN\s*\][\s\S]*/gi, '').trim()}
                      </div>
                    </div>
                  </>
                ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {Object.entries(record.nodes).map(([id, cardName]) => {
                     const nodeDef = spreadDef?.nodes[parseInt(id) - 1];
                     return (
                       <div 
                         key={id} 
                         onClick={() => setFocusedNodeId(parseInt(id))}
                         className="material-terminal node-reflection-row"
                         style={{ 
                           border: '1px solid var(--magi-orange)', 
                           padding: '12px', 
                           background: 'rgba(255, 102, 0, 0.02)',
                           cursor: 'pointer',
                           display: 'flex',
                           flexDirection: 'column',
                           gap: '6px',
                           transition: 'background-color 0.2s'
                         }}
                       >
                         {/* Card Name */}
                         <div style={{ 
                           fontSize: '0.7rem', 
                           color: 'var(--eva-cyan)', 
                           fontWeight: 'bold', 
                           letterSpacing: '1px',
                           fontFamily: 'monospace'
                         }}>
                           [ CARD: {cardName.toUpperCase()} ]
                         </div>

                         {/* Node Title */}
                         <div style={{ 
                           color: 'var(--magi-orange)', 
                           fontSize: '0.75rem', 
                           fontWeight: 'bold', 
                           fontFamily: 'monospace' 
                         }}>
                           NODE {id}: {nodeDef?.title.toUpperCase() || 'Unknown'}
                         </div>

                         {/* Node Prompt (Question/Description) */}
                         {nodeDef?.description && (
                           <div style={{ 
                             fontSize: '0.65rem', 
                             color: 'rgba(230, 237, 243, 0.5)', 
                             fontFamily: 'monospace',
                             lineHeight: '1.3'
                           }}>
                             PROMPT: {nodeDef.description}
                           </div>
                         )}

                         {/* User Note */}
                         <div style={{ 
                           fontSize: '0.75rem', 
                           color: 'rgba(230, 237, 243, 0.85)', 
                           fontFamily: 'monospace', 
                           background: 'rgba(5, 7, 10, 0.8)', 
                           padding: '8px', 
                           borderLeft: '2px solid var(--eva-cyan)',
                           marginTop: '4px'
                         }}>
                           {record.cardNotes?.[parseInt(id)] ? `"${record.cardNotes[parseInt(id)]}"` : '[ NO REFLECTION NOTE ENTERED ]'}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </div>

              {/* Footer Telemetry */}
              <div style={{ 
                padding: '10px 0px 0px', 
                borderTop: '1px solid rgba(0, 240, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--ghost-white)', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={10} /> STATUS: ARCHIVED</div>
                </div>
              </div>
          </TerminalFrame>
        </motion.div>
      </motion.div>

      {/* Pop up the NodeFocusModal directly on top of the modal */}
      <NodeFocusModal 
        nodeId={focusedNodeId} 
        onClose={() => setFocusedNodeId(null)}
        archiveNodes={record.nodes}
        archiveSpreadId={record.spreadId}
        zIndex={5500}
      />
    </AnimatePresence>
  );
};
