// src/components/ui/VesperLoFi.tsx
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { useVesperStore } from '../../modules/StateManager/vesperStore';

export const VesperLoFi = () => {
  const imagePath = '/Anishter_samne.png';
  const [mood, setMood] = useState<'IDLE' | 'SCAN' | 'GLITCH' | 'BLINK'>('IDLE');
  const { cameraEnabled, micEnabled } = useVesperStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    const moods: ('IDLE' | 'SCAN' | 'GLITCH' | 'BLINK')[] = ['IDLE', 'SCAN', 'GLITCH', 'BLINK'];
    const interval = setInterval(() => {
      setMood(moods[Math.floor(Math.random() * moods.length)]);
      setTimeout(() => setMood('IDLE'), 800);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle Camera Feed
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraEnabled && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => console.error("Camera access denied", err));
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [cameraEnabled]);

  // Handle Audio Visualization
  useEffect(() => {
    let interval: number;
    if (micEnabled) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100) as unknown as number;
    }
    return () => clearInterval(interval);
  }, [micEnabled]);

  return (
    <div className="terminal-frame" style={{
      width: '280px',
      height: '320px',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px',
      gap: '10px',
      boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)',
      borderColor: 'rgba(0, 240, 255, 0.2)'
    }}>
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,240,255,0.2)', paddingBottom: '5px' }}>
        <div className="telemetry">[FAM ID: V9-ANISHTER]</div>
        <div className="telemetry" style={{ color: mood === 'GLITCH' ? 'var(--magi-violet)' : 'var(--eva-cyan)' }}>
          MODE: {mood}
        </div>
      </div>

      {/* CRT Screen */}
      <div style={{
        flex: 1,
        backgroundColor: '#05070a',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(0,240,255,0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px'
      }}>
        <div className="scanline" style={{ opacity: 0.1 }}></div>
        
        {/* Camera Preview Overlay */}
        {cameraEnabled && (
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline
            style={{ 
              position: 'absolute', 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              opacity: 0.2,
              filter: 'grayscale(1) brightness(0.8) contrast(1.2)'
            }} 
          />
        )}

        {/* Vesper Character Sprite */}
        <motion.div
          animate={mood === 'GLITCH' ? {
            x: [0, -2, 2, -1, 1, 0],
            skewX: [0, 5, -5, 2, -2, 0],
            filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(0deg)']
          } : {
            y: [0, -4, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: mood === 'GLITCH' ? 0.2 : 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${imagePath})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: mood === 'BLINK' ? 0 : 0.9,
            filter: mood === 'SCAN' ? 'brightness(1.5) contrast(1.2)' : 'none',
            zIndex: 2
          }}
        />

        {/* Audio Visualizer Bar */}
        {micEnabled && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            height: '2px',
            backgroundColor: 'rgba(0, 240, 255, 0.1)',
            zIndex: 5
          }}>
            <motion.div 
              animate={{ width: `${audioLevel}%` }}
              style={{ height: '100%', backgroundColor: 'var(--eva-cyan)', boxShadow: '0 0 5px var(--eva-cyan)' }} 
            />
          </div>
        )}

        {/* Emotive Overlays */}
        <AnimatePresence>
          {mood === 'SCAN' && (
            <motion.div
              initial={{ top: '-10%' }}
              animate={{ top: '110%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "linear" }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '2px',
                backgroundColor: 'var(--eva-cyan)',
                boxShadow: '0 0 10px var(--eva-cyan)',
                zIndex: 4
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <div style={{ flex: 1, height: '4px', backgroundColor: 'rgba(0,240,255,0.1)' }}>
          <motion.div 
            animate={{ width: ['20%', '80%', '40%', '95%'] }}
            transition={{ duration: 10, repeat: Infinity }}
            style={{ height: '100%', backgroundColor: 'var(--eva-cyan)' }} 
          />
        </div>
        <div className="telemetry" style={{ fontSize: '0.5rem', color: 'var(--vesper-blue)' }}>
          {micEnabled ? 'VOICE ACTV' : 'SILENCE'} | {cameraEnabled ? 'VIS ON' : 'VIS OFF'}
        </div>
      </div>
    </div>
  );
};
