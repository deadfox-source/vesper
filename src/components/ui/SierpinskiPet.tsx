import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../../modules/StateManager/boardState';
import { useVesperStore } from '../../modules/StateManager/vesperStore';

export const SierpinskiPet: React.FC = () => {
  const boardState = useBoardStore();
  const isSpeaking = useVesperStore(state => state.isSpeaking);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();

    const render = (currentTime: number) => {
      setTime((currentTime - startTime) / 1000);
      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const calculatePetStage = () => {
    const count = Object.keys(boardState.nodes).length;
    if (count === 0) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    if (count <= 9) return 4;
    return 5;
  };

  const stage = calculatePetStage();
  const pulse = isSpeaking ? 1.15 : (1.0 + Math.sin(time * 1.5) * 0.03);

  const cx = 300;
  const cy = 300;
  const baseRadius = 300 * 0.35;

  const getPolygonPoints = (radius: number, sides: number, rotation: number) => {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2.0 * Math.PI / sides) + rotation;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  const drawConcentricRays = (radius: number, count: number, rotation: number, color: string) => {
    const lines = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * 2.0 * Math.PI / count) + rotation;
      const startX = cx + (radius * 0.6) * Math.cos(angle);
      const startY = cy + (radius * 0.6) * Math.sin(angle);
      const endX = cx + radius * Math.cos(angle);
      const endY = cy + radius * Math.sin(angle);
      lines.push(<line key={i} x1={startX} y1={startY} x2={endX} y2={endY} stroke={color} strokeWidth="1" />);
    }
    return lines;
  };

  return (
    <svg width="600" height="600" viewBox="0 0 600 600" style={{ pointerEvents: 'none' }}>
      <g style={{ transition: 'transform 0.2s ease-out' }}>
        {/* Stage 1: Core Octahedron / Diamond Wireframe */}
        <polygon 
          points={getPolygonPoints(baseRadius * 0.4 * pulse, 6, time * 0.4)} 
          fill="none" 
          stroke="var(--eva-cyan)" 
          strokeWidth="1.5" 
          opacity="0.8" 
        />
        <polygon 
          points={getPolygonPoints(baseRadius * 0.25 * pulse, 3, -time * 0.8)} 
          fill="none" 
          stroke="var(--magi-violet)" 
          strokeWidth="1.2" 
          opacity="0.9" 
        />

        {/* Stage 2+: Outer Concentric Orbital Hexagon */}
        {stage >= 2 && (
          <polygon 
            points={getPolygonPoints(baseRadius * 0.7 * pulse, 6, -time * 0.2)} 
            fill="none" 
            stroke="var(--eva-cyan)" 
            strokeWidth="1.0" 
            strokeDasharray="4 4" 
            opacity="0.5" 
          />
        )}

        {/* Stage 3+: Radiating Data Vectors */}
        {stage >= 3 && (
          <g>
            {drawConcentricRays(baseRadius * 0.85, 12, time * 0.1, 'rgba(255, 102, 0, 0.4)')}
          </g>
        )}

        {/* Stage 4+: Complex Sacred Geometry Overlay */}
        {stage >= 4 && (
          <polygon 
            points={getPolygonPoints(baseRadius * 0.95 * pulse, 12, time * 0.15)} 
            fill="none" 
            stroke="var(--magi-violet)" 
            strokeWidth="1.0" 
            opacity="0.4" 
          />
        )}

        {/* Stage 5: Fully Integrated Holographic Matrix */}
        {stage >= 5 && (
          <polygon 
            points={getPolygonPoints(baseRadius * 1.1 * pulse, 8, -time * 0.3)} 
            fill="none" 
            stroke="var(--eva-cyan)" 
            strokeWidth="1.5" 
            opacity="0.6" 
          />
        )}
      </g>
    </svg>
  );
};
