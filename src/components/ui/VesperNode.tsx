import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { useBoardStore } from '../../modules/StateManager/boardState';
import { speakVesperText } from '../../modules/utils/vesperSpeech';

export const VesperNode = () => {
  const { vesperMood, vesperEnergy, setVesperMood, setVesperEnergy } = useBoardStore();
  const controls = useAnimation();
  const [clickCount, setClickCount] = useState(0);

  // Appearance logic based on mood and energy
  const getAvatarStyles = () => {
    let color = 'var(--eva-cyan)';
    let scale = 1;
    let blur = '8px';

    if (vesperMood === 'agitated') {
      color = 'var(--magi-orange)';
      blur = '15px';
      scale = 1.1;
    } else if (vesperMood === 'sleepy') {
      color = 'var(--vesper-blue)';
      blur = '4px';
      scale = 0.9;
    } else if (vesperMood === 'focused') {
      color = 'var(--magi-violet)';
      blur = '12px';
      scale = 1.05;
    }

    if (vesperEnergy < 30) {
       scale *= 0.8;
       blur = '2px';
       color = 'rgba(255,255,255,0.4)';
    }

    return { color, scale, blur };
  };

  const { color, scale, blur } = getAvatarStyles();

  // Energy drain over time
  useEffect(() => {
    const timer = setInterval(() => {
      setVesperEnergy(prev => prev > 0 ? prev - 1 : 0);
    }, 5000); // drain 1 energy every 5 seconds
    
    return () => clearInterval(timer);
  }, [setVesperEnergy]);

  // Update mood based on energy
  useEffect(() => {
    if (vesperEnergy < 20 && vesperMood !== 'sleepy' && vesperMood !== 'agitated') {
      setVesperMood('sleepy');
    } else if (vesperEnergy > 80 && vesperMood === 'sleepy') {
      setVesperMood('idle');
    }
  }, [vesperEnergy, vesperMood, setVesperMood]);

  const [blinkDelay] = React.useState(() => Math.random() * 5 + 2);

  const handlePoke = () => {
    controls.start({
      scale: [1, 0.9, 1.1, 1],
      transition: { duration: 0.3 }
    });

    setClickCount(prev => prev + 1);
    
    // Annoy Vesper logic
    if (clickCount > 3 && clickCount < 7) {
      setVesperMood('agitated');
      if (clickCount === 4) speakVesperText("Stop tapping the glass, Operator.");
    } else if (clickCount >= 7) {
      if (clickCount === 7) speakVesperText("You are distorting my quantum integrity!");
      setVesperEnergy(prev => prev - 5);
    } else {
       // Wake him up if he was sleepy
       if (vesperMood === 'sleepy') {
          setVesperMood('idle');
          setVesperEnergy(prev => prev + 10);
       }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
      <motion.div 
        onClick={handlePoke}
        animate={controls}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)`,
          boxShadow: `0 0 ${blur} ${color}, inset 0 0 20px rgba(0,0,0,0.5)`,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: `1px solid ${color}`,
          transform: `scale(${scale})`
        }}
      >
        <motion.div 
           animate={{ 
             scaleY: [1, 0.1, 1], // Blink
           }}
           transition={{ 
             duration: 0.2, 
             repeat: Infinity, 
             repeatDelay: blinkDelay // random blink delay
           }}
           style={{
             width: '20px',
             height: '40px',
             borderRadius: '50%',
             background: 'black',
             boxShadow: `0 0 5px ${color}`
           }}
        />
      </motion.div>
      <div style={{ fontSize: '0.6rem', opacity: 0.7, textAlign: 'center' }}>
        <div>[ DAEMON CORE: {vesperEnergy}% ]</div>
        <div style={{ color, textTransform: 'uppercase' }}>STATUS: {vesperMood}</div>
      </div>
    </div>
  );
};
