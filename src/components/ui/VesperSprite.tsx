import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useAnimation } from 'motion/react';
import { useBoardStore } from '../../modules/StateManager/boardState';
import { useVesperStore } from '../../modules/StateManager/vesperStore';
import { useShallow } from 'zustand/react/shallow';
import { speakVesperText } from '../../modules/utils/vesperSpeech';
import { ScrambleText } from './ScrambleText';
import './VesperSprite.css';

export const VesperSprite: React.FC = () => {
  const {
    vesperMood,
    vesperEnergy,
    setVesperMood,
    setVesperEnergy,
    v9_social_logic_error,
    setSocialLogicError
  } = useBoardStore(
    useShallow((state) => ({
      vesperMood: state.vesperMood,
      vesperEnergy: state.vesperEnergy,
      setVesperMood: state.setVesperMood,
      setVesperEnergy: state.setVesperEnergy,
      v9_social_logic_error: state.v9_social_logic_error,
      setSocialLogicError: state.setSocialLogicError
    }))
  );

  const { isSpeaking, isListening } = useVesperStore(
    useShallow((state) => ({
      isSpeaking: state.isSpeaking,
      isListening: state.isListening
    }))
  );

  const controls = useAnimation();
  const [clickCount, setClickCount] = useState(0);
  const [asciiFiles, setAsciiFiles] = useState<Record<string, string>>({});
  const [isBlinking, setIsBlinking] = useState(false);
  const [scrambleKey, setScrambleKey] = useState(0);

  useEffect(() => {
    const randomScrambleInterval = setInterval(() => {
       // Random chance to occasionally trigger a glitch/scramble effect on his face
       if (Math.random() > 0.6) {
          setScrambleKey(prev => prev + 1);
       }
    }, 6000);
    return () => clearInterval(randomScrambleInterval);
  }, []);

  useEffect(() => {
    if (vesperMood === 'sleepy') return; // already eyes closed
    const blinkInterval = setInterval(() => {
      // Random chance to blink every 3.5 seconds
      if (Math.random() > 0.4) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150); // fast blink
        // Double blink logic
        if (Math.random() > 0.7) {
           setTimeout(() => setIsBlinking(true), 250);
           setTimeout(() => setIsBlinking(false), 400);
        }
      }
    }, 3500);
    return () => clearInterval(blinkInterval);
  }, [vesperMood]);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const [normal, sad, happy, sleepy] = await Promise.all([
          fetch('/vesper_states/Normal.txt').then(r => r.text()),
          fetch('/vesper_states/Sad.txt').then(r => r.text()),
          fetch('/vesper_states/Happy.txt').then(r => r.text()),
          fetch('/vesper_states/Eyesclosed.txt').then(r => r.text())
        ]);
        setAsciiFiles({ normal, sad, happy, sleepy });
      } catch (e) {
        console.error("Failed to load ASCII states:", e);
      }
    };
    loadFiles();
  }, []);

  // Derive styles from mood
  const { color, opacity } = useMemo(() => {
    let colorVal = 'var(--eva-cyan)';
    if (v9_social_logic_error) colorVal = 'var(--magi-orange)';
    else if (vesperMood === 'agitated') colorVal = 'var(--magi-orange)';
    else if (vesperMood === 'sleepy') colorVal = 'var(--eva-cyan)';
    else if (vesperMood === 'focused') colorVal = 'var(--magi-violet)';
    
    // Dim if low energy
    const opacityVal = Math.max(0.4, vesperEnergy / 100);
    return { color: colorVal, opacity: opacityVal };
  }, [vesperMood, vesperEnergy, v9_social_logic_error]);

  const moodCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInteract = () => {
    controls.start({
      scale: [1, 0.95, 1.05, 1],
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.4 }
    });

    setSocialLogicError(true);
    setTimeout(() => setSocialLogicError(false), 300);

    setClickCount(prev => prev + 1);

    if (clickCount > 3 && clickCount < 7) {
      setVesperMood('agitated');
      if (clickCount === 4) speakVesperText("Must you prod the interface, Operator?");
      // Auto-calm after 12 seconds of no further taps
      if (moodCooldownRef.current) clearTimeout(moodCooldownRef.current);
      moodCooldownRef.current = setTimeout(() => {
        setVesperMood('idle');
        setClickCount(0);
      }, 12000);
    } else if (clickCount >= 7) {
      if (clickCount === 7) speakVesperText("Cease this at once! You are destabilizing my core.");
      setVesperEnergy(prev => Math.max(0, prev - 5));
      if (moodCooldownRef.current) clearTimeout(moodCooldownRef.current);
      moodCooldownRef.current = setTimeout(() => {
        setVesperMood('idle');
        setClickCount(0);
      }, 15000);
    } else {
       if (vesperMood === 'sleepy') {
          setVesperMood('idle');
          setVesperEnergy(prev => Math.min(100, prev + 15));
       }
    }
  };

  let currentAscii = asciiFiles.normal || '';
  if ((vesperMood as string) === 'sad') currentAscii = asciiFiles.sad || '';
  if ((vesperMood as string) === 'happy') currentAscii = asciiFiles.happy || '';
  if (vesperMood === 'sleepy') currentAscii = asciiFiles.sleepy || '';
  if (vesperMood === 'agitated') currentAscii = asciiFiles.sad || '';
  if (vesperMood === 'focused') currentAscii = asciiFiles.normal || '';

  const chassisBorderColor = v9_social_logic_error ? 'var(--magi-orange)' : 'var(--vesper-blue)';
  const headerBgColor = v9_social_logic_error ? 'var(--magi-orange)' : 'var(--vesper-blue)';

  return (
    <div className="vesper-entity-wrapper">
      <div className="material-terminal vesper-window-chassis" style={{ borderColor: chassisBorderColor }}>
        
        {/* Terminal Header — Archive Block Style */}
        <div className="vesper-window-header" style={{ borderColor: color, background: headerBgColor, color: 'var(--void-black)' }}>
           <span>&gt; <ScrambleText text="VESPER CORE v9" duration={2} /></span>
           <div className="vesper-window-controls" style={{ color: 'rgba(0,0,0,0.5)' }}>
              <span className="ctrl-btn">[ ]</span>
              <span className="ctrl-btn" onClick={() => setVesperEnergy(100)}>[+]</span>
           </div>
        </div>



        {/* Avatar Container */}
        <div 
          className="vesper-sprite-container" 
          onClick={handleInteract}
          style={{ cursor: 'pointer', borderColor: color, position: 'relative', overflow: 'hidden' }}
          role="button"
          aria-label="Interact with Vesper Core"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleInteract();
            }
          }}
        >
          {/* Core Image rendered directly as ASCII, filling the container */}
          <motion.div
             animate={controls}
             style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%', 
                opacity: opacity,
                display: 'flex', justifyContent: 'center', alignItems: 'center'
             }}
          >
             {/* Listening Aura Ring */}
             {isListening && (
               <motion.div
                 animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                 style={{
                   position: 'absolute',
                   top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                   width: '100%', height: '100%',
                   borderRadius: '50%',
                   border: `2px solid var(--magi-orange)`,
                   zIndex: 0
                 }}
               />
             )}

             <motion.pre 
                animate={{
                   opacity: isBlinking ? 0 : (isSpeaking ? [0.75, 1, 0.75] : [1, 1, 1])
                }}
                transition={{ duration: isSpeaking ? 0.3 : 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ 
                   margin: 0,
                   fontFamily: 'var(--sans)',
                   fontSize: '10px',
                   lineHeight: '9px',
                   color: color,
                   zIndex: 1,
                   whiteSpace: 'pre',
                   textAlign: 'center'
                }}
             >
                <ScrambleText key={`${vesperMood}-${scrambleKey}`} text={currentAscii} delay={0} duration={0.8} />
             </motion.pre>

             {/* Blink Overlay Layer */}
             {isBlinking && (
                <motion.pre 
                   style={{ 
                      position: 'absolute',
                      margin: 0,
                      fontFamily: 'var(--sans)',
                      fontSize: '10px',
                      lineHeight: '9px',
                      color: color,
                      zIndex: 2,
                      whiteSpace: 'pre',
                      textAlign: 'center'
                   }}
                >
                   {asciiFiles.sleepy}
                </motion.pre>
             )}
             {/* If agitated, add red glitch bars sweeping over */}
             {vesperMood === 'agitated' && (
                <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 4, pointerEvents: 'none' }}>
                   <motion.div
                      animate={{ y: ['0%', '100%', '0%'] }}
                      transition={{ duration: 0.15, repeat: Infinity, ease: 'linear' }}
                      style={{ width: '100%', height: '4px', backgroundColor: 'var(--magi-orange)', opacity: 0.6 }}
                   />
                </div>
             )}
          </motion.div>

          <div className="vesper-scan-sweep" style={{ zIndex: 10 }}></div>
        </div>
      </div>
    </div>
  );
};
