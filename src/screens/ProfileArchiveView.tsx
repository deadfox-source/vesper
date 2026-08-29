import { Trash2, Calendar, User as UserIcon, Layout, Database, AlertTriangle, BookOpen, Zap } from 'lucide-react';
import { ScrambleText } from '../components/ui/ScrambleText';
import { useRecordStore } from '../modules/StateManager/recordStore';
import type { VesperRecord } from '../modules/StateManager/recordStore';
import { useProfileStore, type JournalEntry } from '../modules/StateManager/profileStore';
import { motion, AnimatePresence } from 'motion/react';
import { RecordDetailModal } from '../components/ui/RecordDetailModal';
import { DailyReflectionModal } from '../components/ui/DailyReflectionModal';
import { JournalDetailModal } from '../components/ui/JournalDetailModal';
import { VesperHeader } from '../components/ui/VesperHeader';

import { useState, useMemo } from 'react';

import { calculateIndividuationMatrix } from '../modules/utils/individuationMatrix';

export const ProfileArchiveView = () => {
  const { savedRecords, deleteRecord, clearAll } = useRecordStore();
  const { journalEntries, savedConversations, deleteJournalEntry, clearJournal, deleteSavedConversation } = useProfileStore();
  const [selectedRecord, setSelectedRecord] = useState<VesperRecord | null>(null);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'purge' | 'delete' | 'delete_journal' | 'purge_journal'; recordId?: string } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'readings' | 'journal' | 'conversations'>('readings');
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [selectedMatrixPart, setSelectedMatrixPart] = useState<'persona' | 'shadow' | 'anima' | 'self' | null>(null);

  // Calculate Individuation Matrix based on drawn cards in journal entries
  const matrixStats = useMemo(() => calculateIndividuationMatrix(journalEntries), [journalEntries]);

  return (
    <div className="archive-container terminal-frame" style={{ padding: '0', border: 'none', background: 'transparent', flex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <VesperHeader 
        title="INDIVIDUATION PROFILE"
        accentColor="var(--magi-violet)"
        telemetryData={[
          { icon: <Database size={14} />, label: 'IND', value: savedRecords.length.toString(), color: 'var(--eva-cyan)' },
          { icon: <BookOpen size={14} />, label: 'JRNL', value: journalEntries.length.toString(), color: 'var(--eva-cyan)' },
          { icon: <Zap size={14} />, label: 'CONVOS', value: savedConversations.length.toString(), color: 'var(--eva-cyan)' }
        ]}
        actions={undefined}
      />

      <div style={{ padding: '16px 8px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* SELF-ACTUALIZATION / INDIVIDUATION MATRIX */}
        <div style={{ marginBottom: '30px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', width: '100%' }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '0.8rem', 
              color: 'var(--void-black)', 
              background: 'var(--magi-violet)', 
              padding: '4px 10px', 
              display: 'flex', 
              justifyContent: 'space-between',
              fontWeight: 'bold',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <span>&gt; <ScrambleText text="INDIVIDUATION MATRIX" duration={1.5} /></span>
              <span style={{ opacity: 0.8 }}>[ ACTIVE ]</span>
            </h2>
          </div>
          
          <div style={{
              background: 'rgba(139, 92, 246, 0.03)',
              border: '1px solid var(--magi-violet)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
          }}>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between' }}>
                <div 
                  onClick={() => setSelectedMatrixPart(selectedMatrixPart === 'persona' ? null : 'persona')}
                  style={{ textAlign: 'center', flex: '1 1 20%', cursor: 'pointer', padding: '5px', border: `1px solid ${selectedMatrixPart === 'persona' ? '#ccc' : 'transparent'}`, background: selectedMatrixPart === 'persona' ? 'rgba(200,200,200,0.05)' : 'transparent' }}
                >
                    <div style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '5px', fontFamily: 'monospace' }}>{matrixStats.persona}%</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--ghost-white)', opacity: 0.7, letterSpacing: '1px' }}>[ PERSONA ]</div>
                </div>
                <div 
                  onClick={() => setSelectedMatrixPart(selectedMatrixPart === 'shadow' ? null : 'shadow')}
                  style={{ textAlign: 'center', flex: '1 1 20%', cursor: 'pointer', padding: '5px', border: `1px solid ${selectedMatrixPart === 'shadow' ? 'var(--magi-violet)' : 'transparent'}`, background: selectedMatrixPart === 'shadow' ? 'rgba(139, 92, 246, 0.05)' : 'transparent' }}
                >
                    <div style={{ fontSize: '1.2rem', color: 'var(--magi-violet)', marginBottom: '5px', fontFamily: 'monospace' }}>{matrixStats.shadow}%</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--ghost-white)', opacity: 0.7, letterSpacing: '1px' }}>[ SHADOW ]</div>
                </div>
                <div 
                  onClick={() => setSelectedMatrixPart(selectedMatrixPart === 'anima' ? null : 'anima')}
                  style={{ textAlign: 'center', flex: '1 1 20%', cursor: 'pointer', padding: '5px', border: `1px solid ${selectedMatrixPart === 'anima' ? 'var(--magi-orange)' : 'transparent'}`, background: selectedMatrixPart === 'anima' ? 'rgba(255, 102, 0, 0.05)' : 'transparent' }}
                >
                    <div style={{ fontSize: '1.2rem', color: 'var(--magi-orange)', marginBottom: '5px', fontFamily: 'monospace' }}>{matrixStats.anima}%</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--ghost-white)', opacity: 0.7, letterSpacing: '1px' }}>[ ANIMA ]</div>
                </div>
                <div 
                  onClick={() => setSelectedMatrixPart(selectedMatrixPart === 'self' ? null : 'self')}
                  style={{ textAlign: 'center', flex: '1 1 20%', cursor: 'pointer', padding: '5px', border: `1px solid ${selectedMatrixPart === 'self' ? 'var(--eva-cyan)' : 'transparent'}`, background: selectedMatrixPart === 'self' ? 'rgba(0, 240, 255, 0.05)' : 'transparent' }}
                >
                    <div style={{ fontSize: '1.2rem', color: 'var(--eva-cyan)', marginBottom: '5px', fontFamily: 'monospace' }}>{matrixStats.self}%</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--ghost-white)', opacity: 0.7, letterSpacing: '1px' }}>[ SELF ]</div>
                </div>
             </div>

             <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', display: 'flex', width: '100%', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${matrixStats.persona}%` }} transition={{ duration: 1, delay: 0.2 }} style={{ height: '100%', background: '#ccc' }} />
                <motion.div initial={{ width: 0 }} animate={{ width: `${matrixStats.shadow}%` }} transition={{ duration: 1, delay: 0.4 }} style={{ height: '100%', background: 'var(--magi-violet)' }} />
                <motion.div initial={{ width: 0 }} animate={{ width: `${matrixStats.anima}%` }} transition={{ duration: 1, delay: 0.6 }} style={{ height: '100%', background: 'var(--magi-orange)' }} />
                <motion.div initial={{ width: 0 }} animate={{ width: `${matrixStats.self}%` }} transition={{ duration: 1, delay: 0.8 }} style={{ height: '100%', background: 'var(--eva-cyan)' }} />
             </div>

             {selectedMatrixPart && (
               <div style={{ 
                 padding: '12px', 
                 border: `1px solid ${
                   selectedMatrixPart === 'persona' ? '#ccc' : 
                   selectedMatrixPart === 'shadow' ? 'var(--magi-violet)' : 
                   selectedMatrixPart === 'anima' ? 'var(--magi-orange)' : 'var(--eva-cyan)'
                 }`, 
                 background: 'rgba(5, 7, 10, 0.95)',
                 fontSize: '0.75rem',
                 color: 'var(--ghost-white)',
                 fontFamily: 'monospace',
                 lineHeight: '1.4'
               }}>
                 <div style={{ 
                   color: 
                     selectedMatrixPart === 'persona' ? '#ccc' : 
                     selectedMatrixPart === 'shadow' ? 'var(--magi-violet)' : 
                     selectedMatrixPart === 'anima' ? 'var(--magi-orange)' : 'var(--eva-cyan)', 
                   fontWeight: 'bold', 
                   marginBottom: '4px' 
                 }}>
                   [ MATRIX VARIABLE: {selectedMatrixPart.toUpperCase()} ]
                 </div>
                 {selectedMatrixPart === 'persona' && "PERSONA: Represents the digital mask and structural shield presented to the system interfaces. Built through active table operations."}
                 {selectedMatrixPart === 'shadow' && "SHADOW: Tracks the unrevealed, repressed, or unconscious coordinates. It acts as the raw occult backend potential to be cataloged."}
                 {selectedMatrixPart === 'anima' && "ANIMA: The subjective aesthetic and emotional channel. Functions as the analog haptic connection to intuitive alignment."}
                 {selectedMatrixPart === 'self' && "SELF: The synthesized state of actualization. Harmonizes Persona, Shadow, and Anima values into unified resonance."}
               </div>
             )}
          </div>
        </div>

        {/* REFLECT BUTTON DIRECTLY BELOW MATRIX */}
        <motion.button
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => setIsReflectionModalOpen(true)}
           className="primary-btn holographic-border"
           style={{
             background: 'var(--magi-violet)',
             color: 'var(--void-black)',
             padding: '15px 20px',
             fontSize: '1.1rem',
             fontWeight: 'bold',
             letterSpacing: '2px',
             fontFamily: 'monospace',
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             width: '100%',
             boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)',
             border: 'none',
             flexShrink: 0,
             marginBottom: '30px'
           }}
        >
          [ INITIATE PROTOCOL ]
        </motion.button>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => setActiveTab('readings')}
            style={{ 
              background: activeTab === 'readings' ? 'var(--magi-violet)' : 'transparent', 
              color: activeTab === 'readings' ? 'var(--void-black)' : 'var(--ghost-white)',
              border: 'none', 
              padding: '6px 12px', 
              fontSize: '0.75rem', 
              fontFamily: 'monospace', 
              cursor: 'pointer',
              opacity: activeTab === 'readings' ? 1 : 0.6
            }}>
            &gt; INQUIRY MISSIONS
          </button>
          <button 
            onClick={() => setActiveTab('journal')}
            style={{ 
              background: activeTab === 'journal' ? 'var(--magi-violet)' : 'transparent', 
              color: activeTab === 'journal' ? 'var(--void-black)' : 'var(--ghost-white)',
              border: 'none', 
              padding: '6px 12px', 
              fontSize: '0.75rem', 
              fontFamily: 'monospace', 
              cursor: 'pointer',
              opacity: activeTab === 'journal' ? 1 : 0.6
            }}>
            &gt; JOURNAL ENTRIES
          </button>
          <button 
            onClick={() => setActiveTab('conversations')}
            style={{ 
              background: activeTab === 'conversations' ? 'var(--eva-cyan)' : 'transparent', 
              color: activeTab === 'conversations' ? 'var(--void-black)' : 'var(--ghost-white)',
              border: 'none', 
              padding: '6px 12px', 
              fontSize: '0.75rem', 
              fontFamily: 'monospace', 
              cursor: 'pointer',
              opacity: activeTab === 'conversations' ? 1 : 0.6
            }}>
            &gt; SAVED CONVERSATIONS
          </button>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', zIndex: 10, paddingBottom: '20px' }}>
           {activeTab === 'readings' ? (
             savedRecords.length === 0 ? (
               <div style={{ padding: '40px', border: '1px dashed var(--eva-cyan)', textAlign: 'center', color: 'rgba(0, 240, 255, 0.5)', background: 'rgba(5, 7, 10, 0.4)' }}>
                  [ SYSTEM READY ] NO PREVIOUS INDIVIDUATION RECORDS IN ARCHIVE.
               </div>
             ) : (
               savedRecords.map((record) => (
                 <motion.div 
                   key={record.id}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   whileHover={{ backgroundColor: 'var(--eva-cyan)' }}
                   onClick={() => setSelectedRecord(record)}
                   className="material-terminal"
                   style={{ padding: '15px', backgroundColor: 'var(--void-black)', border: '2px solid var(--eva-cyan)', position: 'relative', cursor: 'pointer', transition: 'none' }}
                 >
                    <div className="record-content-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="record-label" style={{ color: 'var(--eva-cyan)', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <UserIcon size={12} /> {record.subjectName.toUpperCase()}
                        </div>
                        <div className="record-sub" style={{ color: 'white', opacity: 0.5, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={10} /> {new Date(record.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setPendingAction({ type: 'delete', recordId: record.id }); }}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255, 50, 50, 0.8)', cursor: 'pointer', zIndex: 20 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', padding: '5px', border: '1px solid var(--magi-orange)', background: 'rgba(255, 102, 0, 0.05)' }}>
                       <Layout size={14} style={{ color: 'var(--magi-orange)' }} />
                       <span style={{ color: 'var(--magi-orange)', fontSize: '0.7rem', fontWeight: 'bold' }}>[ {record.spreadName} ]</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', maxHeight: '44px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: 'monospace' }}>
                      {record.query && <span style={{ color: 'var(--eva-cyan)', fontStyle: 'italic', marginRight: '6px' }}>[ {record.query} ]</span>}
                      {record.synthesis}...
                    </div>
                 </motion.div>
               ))
             )
           ) : activeTab === 'journal' ? (
             journalEntries.length === 0 ? (
               <div style={{ padding: '40px', border: '1px dashed var(--magi-violet)', textAlign: 'center', color: 'rgba(139, 92, 246, 0.5)', background: 'rgba(5, 7, 10, 0.4)' }}>
                  [ SYSTEM READY ] NO JOURNAL ENTRIES FOUND. INITIATE DAILY REFLECTION.
               </div>
             ) : (
               journalEntries.map((entry) => (
                 <motion.div 
                   key={entry.id}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   whileHover={{ backgroundColor: 'var(--magi-violet)' }}
                   onClick={() => setSelectedJournalEntry(entry)}
                   className="material-terminal"
                   style={{ padding: '15px', backgroundColor: 'var(--void-black)', border: '2px solid var(--magi-violet)', position: 'relative', cursor: 'pointer', transition: 'none' }}
                 >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ color: 'var(--magi-violet)', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <BookOpen size={12} /> {entry.drawnCardName.toUpperCase()}
                        </div>
                        <div style={{ color: 'white', opacity: 0.5, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={10} /> {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPendingAction({ type: 'delete_journal', recordId: entry.id })}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255, 50, 50, 0.8)', cursor: 'pointer', zIndex: 20 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>

                    <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.05)', borderLeft: '2px solid var(--magi-violet)', marginBottom: '10px', fontSize: '0.75rem', color: 'var(--magi-violet)', fontStyle: 'italic' }}>
                      "{entry.vesperPrompt}"
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {entry.userEntry}
                    </div>
                 </motion.div>
               ))
             )
           ) : (
              savedConversations.length === 0 ? (
                <div style={{ padding: '40px', border: '1px dashed var(--eva-cyan)', textAlign: 'center', color: 'rgba(0, 240, 255, 0.5)', background: 'rgba(5, 7, 10, 0.4)' }}>
                   [ SYSTEM READY ] NO SAVED CONVERSATIONS FOUND.
                </div>
              ) : (
                savedConversations.map((insight) => (
                  <motion.div 
                    key={insight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="material-terminal"
                    style={{ padding: '15px', backgroundColor: 'var(--void-black)', border: '2px solid var(--eva-cyan)', position: 'relative', transition: 'none' }}
                  >
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                         <div style={{ color: 'var(--eva-cyan)', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                           <BookOpen size={12} /> {insight.title.toUpperCase()}
                         </div>
                         <div style={{ color: 'white', opacity: 0.5, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                           <Calendar size={10} /> {new Date(insight.timestamp).toLocaleString()}
                         </div>
                       </div>
                       <motion.button 
                         whileTap={{ scale: 0.9 }}
                         onClick={() => deleteSavedConversation(insight.id)}
                         style={{ background: 'transparent', border: 'none', color: 'rgba(255, 50, 50, 0.8)', cursor: 'pointer', zIndex: 20 }}
                       >
                         <Trash2 size={16} />
                       </motion.button>
                     </div>

                     <div style={{ padding: '10px', background: 'rgba(0, 240, 255, 0.05)', borderLeft: '2px solid var(--eva-cyan)', marginBottom: '10px', fontSize: '0.75rem', color: 'var(--eva-cyan)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       {insight.chatLog.map((log, idx) => (
                         <div key={idx} style={{ color: log.role === 'vesper' ? 'var(--eva-cyan)' : 'var(--ghost-white)' }}>
                           <strong>{log.role === 'vesper' ? 'VESPER: ' : 'OPERATOR: '}</strong>{log.text}
                         </div>
                       ))}
                     </div>
                  </motion.div>
                ))
              )
           )}
        </div>
      </div>

      {isReflectionModalOpen && (
        <DailyReflectionModal onClose={() => setIsReflectionModalOpen(false)} />
      )}

      <RecordDetailModal 
        record={selectedRecord} 
        onClose={() => setSelectedRecord(null)} 
      />
      
      {selectedJournalEntry && (
        <JournalDetailModal
          entry={selectedJournalEntry}
          onClose={() => setSelectedJournalEntry(null)}
        />
      )}
      
      {/* DOS-style Confirm Dialog */}
      <AnimatePresence>
        {pendingAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPendingAction(null)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(5, 7, 10, 0.95)',
              backdropFilter: 'blur(10px)',
              zIndex: 4000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="terminal-frame"
              style={{
                padding: '30px',
                width: '100%',
                maxWidth: '400px',
                border: '2px solid rgba(255, 50, 50, 0.6)',
                boxShadow: '0 0 30px rgba(255, 50, 50, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ff3232' }}>
                <AlertTriangle size={24} />
                <h3 style={{ margin: 0, letterSpacing: '3px', fontSize: '1rem' }}>[ CONFIRM DELETION ]</h3>
              </div>
              <div style={{ color: 'var(--ghost-white)', fontSize: '0.85rem', fontFamily: 'monospace', lineHeight: '1.6' }}>
                {pendingAction.type === 'purge'
                  ? '> WARNING: This will permanently destroy ALL archived individuation records. This operation cannot be reversed.'
                  : '> WARNING: This will permanently destroy the selected record. This operation cannot be reversed.'}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPendingAction(null)}
                  className="primary-btn"
                  style={{ flex: 1, fontSize: '0.8rem', borderColor: 'rgba(255,255,255,0.3)', color: 'var(--ghost-white)' }}
                >
                  [ ABORT ]
                </motion.button>
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255, 50, 50, 0.2)', scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (pendingAction.type === 'purge') clearAll();
                    else if (pendingAction.type === 'purge_journal') clearJournal();
                    else if (pendingAction.type === 'delete' && pendingAction.recordId) deleteRecord(pendingAction.recordId);
                    else if (pendingAction.type === 'delete_journal' && pendingAction.recordId) deleteJournalEntry(pendingAction.recordId);
                    setPendingAction(null);
                  }}
                  className="primary-btn"
                  style={{ flex: 1, fontSize: '0.8rem', borderColor: 'rgba(255, 50, 50, 0.6)', color: '#ff3232', backgroundColor: 'rgba(255, 50, 50, 0.05)' }}
                >
                  [ EXEC ]
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CSS Inversion Logic for Record Cards on Hover */}
      <style>{`
        .material-terminal:hover * { 
          color: var(--void-black) !important; 
          border-color: rgba(0, 0, 0, 0.3) !important;
        }
        .material-terminal:hover .record-sub { 
          opacity: 0.6 !important; 
        }
        .material-terminal:hover svg {
          stroke: var(--void-black) !important;
        }
      `}</style>
    </div>
  );
};
