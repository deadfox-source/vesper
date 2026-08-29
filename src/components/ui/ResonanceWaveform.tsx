import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useBoardStore } from '../../modules/StateManager/boardState';

const pseudoRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const ResonanceWaveform = ({ width = '100%', height = 60, emotion = 'neutral' }: { width?: string | number, height?: number, emotion?: string }) => {
  const { nodes } = useBoardStore();
  const activeNodesCount = Object.keys(nodes).length;

  const paths = useMemo(() => {
    // Number of paths scales with node count
    const numPaths = Math.min(3 + Math.floor(activeNodesCount / 2), 8);
    const result = [];
    
    for (let i = 0; i < numPaths; i++) {
      let seedIndex = i * 100;
      const nextRand = () => {
        seedIndex += 1.37;
        return pseudoRandom(seedIndex);
      };

      // amplitude and frequency increase with complexity
      let amp = 8 + nextRand() * 12 * (1 + activeNodesCount * 0.15);
      let freq = 2 + nextRand() * 5 * (1 + activeNodesCount * 0.05);
      
      let color = i % 4 === 0 ? 'var(--magi-orange)' : 'var(--eva-cyan)';
      let speedMult = 1;

      if (emotion === 'positive') {
        amp *= 1.5;
        freq *= 1.5;
        speedMult = 1.5;
        color = i % 3 === 0 ? 'var(--magi-orange)' : 'var(--eva-cyan)';
      } else if (emotion === 'negative') {
        amp *= 0.5;
        freq *= 0.5;
        speedMult = 0.5;
        color = 'var(--vesper-blue)';
      } else if (emotion === 'aggressive') {
        amp *= 2;
        freq *= 2.5;
        speedMult = 2;
        color = 'var(--magi-orange)';
      } else if (emotion === 'embarrassment') {
        freq *= 0.8;
        amp *= 0.8;
        speedMult = 1.2;
        color = i % 2 === 0 ? 'var(--magi-orange)' : 'var(--vesper-blue)';
      }

      let d = `M 0,${height/2}`;
      for (let x = 0; x <= 1000; x += 20) {
        let yOffset = Math.sin((x / 1000) * Math.PI * freq + i * 1.5) * amp;
        
        // Add random glitch spikes at higher complexity or aggressive emotion
        if ((activeNodesCount > 3 || emotion === 'aggressive') && nextRand() > (emotion === 'aggressive' ? 0.4 : 0.8)) {
          yOffset += (nextRand() - 0.5) * ((activeNodesCount || 2) * (emotion === 'aggressive' ? 6 : 3));
        }
        
        d += ` L ${x},${height/2 + yOffset}`;
      }
      
      const dashArray = activeNodesCount > 4 && i % 2 === 0 ? `${5 + nextRand() * 15}, ${5 + nextRand() * 5}` : undefined;
      
      result.push({
        id: i,
        d,
        color,
        dashArray,
        duration: (2 + nextRand() * 3) / speedMult,
        yOffset: (nextRand() - 0.5) * (5 + activeNodesCount),
        strokeWidth: 1 + nextRand()
      });
    }
    return result;
  }, [activeNodesCount, height, emotion]);

  return (
    <div style={{ width, height, position: 'relative', display: 'flex', alignItems: 'center' }}>
      <svg width="100%" height="100%" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        {paths.map((path) => (
          <React.Fragment key={path.id}>
            {/* Glow Path */}
            <motion.path
              d={path.d}
              fill="none"
              stroke={path.color}
              strokeWidth={path.strokeWidth * 3.5}
              strokeDasharray={path.dashArray}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0.05, 0.25, 0.05],
                y: [path.yOffset, -path.yOffset, path.yOffset]
              }}
              transition={{
                pathLength: { duration: 2, ease: "easeOut" },
                opacity: { duration: path.duration, repeat: Infinity, ease: "easeInOut" },
                y: { duration: path.duration * 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{
                willChange: 'transform, opacity'
              }}
            />
            {/* Core Path */}
            <motion.path
              d={path.d}
              fill="none"
              stroke={path.color}
              strokeWidth={path.strokeWidth}
              strokeDasharray={path.dashArray}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0.2, 0.8, 0.2],
                y: [path.yOffset, -path.yOffset, path.yOffset]
              }}
              transition={{
                pathLength: { duration: 2, ease: "easeOut" },
                opacity: { duration: path.duration, repeat: Infinity, ease: "easeInOut" },
                y: { duration: path.duration * 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{
                willChange: 'transform, opacity'
              }}
            />
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
};
