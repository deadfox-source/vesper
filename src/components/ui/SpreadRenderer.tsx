import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { SPREAD_LIBRARY } from '../../modules/StateManager/spreadLibrary';
import { TAROT_DECK_MAP } from '../../constants/tarotDictionary';
import { oscRouter } from '../../modules/Network/oscRouter';
import { useBoardStore } from '../../modules/StateManager/boardState';

const GLYPHS = "010101XYZΩΨΦΣ0123456789<>[]/\\|#*+@&$%".split("");

const SuperpositionNoise: React.FC<{ length: number, active: boolean }> = ({ length, active }) => {
  const [text, setText] = useState("");
  
  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText("?".repeat(length));
      return;
    }
    const interval = setInterval(() => {
      setText(Array.from({ length }).map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(''));
    }, 150); // Throttled to 150ms to drastically reduce DOM redraw overhead
    return () => clearInterval(interval);
  }, [length, active]);
  
  return <>{text}</>;
};

interface SpreadNode {
  id: number;
  x: number;
  y: number;
  title: string;
}

interface SpreadNodeOverlayProps {
  node: SpreadNode;
  index: number;
  layout: { width: number; height: number };
  nodesRecord: Record<number, string>;
  activeStep: number;
  interactive: boolean;
  isAwaitingTap: boolean;
  internalNodeTap: (id: number, x: number, y: number) => void;
}

const SpreadNodeOverlay = React.memo(({
  node,
  index,
  layout,
  nodesRecord,
  activeStep,
  interactive,
  isAwaitingTap,
  internalNodeTap
}: SpreadNodeOverlayProps) => {
  const width = interactive 
    ? Math.max(80, Math.min(160, layout.width * 0.28)) 
    : Math.max(50, Math.min(120, layout.width * 0.22));
  
  const height = width * 1.5;

  const xStart = node.x * layout.width;
  const yStart = node.y * layout.height;

  const assignedCard = nodesRecord[node.id];
  const isPopulated = assignedCard !== undefined;
  const isActiveUserNode = interactive && !isPopulated && node.id === activeStep;
  const isReadyToCollapse = isActiveUserNode && isAwaitingTap;
  const isGuidedMode = useBoardStore((state) => state.isGuidedMode);
  const isLocked = interactive && isGuidedMode && node.id > activeStep;
  const readingContextEnv = useBoardStore((state) => state.readingContext.env);

  const prevPopulated = React.useRef(isPopulated);

  useEffect(() => {
    prevPopulated.current = isPopulated;
  }, [isPopulated]);

  let platonicTag = "DATA";
  if (isPopulated) {
    const cardDef = TAROT_DECK_MAP.get(assignedCard.toUpperCase());
    switch (cardDef?.element) {
      case 'FIRE': platonicTag = 'TETRAHEDRON'; break;
      case 'EARTH': platonicTag = 'HEXAHEDRON'; break;
      case 'AIR': platonicTag = 'OCTAHEDRON'; break;
      case 'WATER': platonicTag = 'ICOSAHEDRON'; break;
      case 'SPIRIT': platonicTag = 'DODECAHEDRON'; break;
    }
  }

  const displayedCardName = assignedCard?.toUpperCase();

  return (
    <motion.div
      id={`spread-node-${node.id}`}
      layoutId={`card-${node.id}`}
      key={`node-${node.id}`}
      className={`material-holographic ${isActiveUserNode ? 'holographic-active' : ''}`}
      style={{
        position: 'absolute',
        left: xStart - width / 2,
        top: yStart - height / 2,
        width: width,
        height: height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: isLocked || !interactive ? 'default' : (isReadyToCollapse ? 'pointer' : 'pointer'),
        zIndex: isPopulated ? 15 : 10,
        pointerEvents: 'auto',
        z: 10,
        border: isLocked
          ? '1px solid rgba(255,255,255,0.05)'
          : (isPopulated
            ? '1px solid var(--eva-cyan)'
            : isReadyToCollapse
              ? '2px solid var(--magi-orange)'
              : isActiveUserNode
                ? '2px solid var(--eva-cyan)'
                : '1px solid rgba(0, 240, 255, 0.3)'),
        background: isPopulated
          ? 'rgba(5, 7, 10, 0.95)'
          : isReadyToCollapse
            ? 'radial-gradient(circle, rgba(255,102,0,0.18) 0%, transparent 70%)'
            : isActiveUserNode
              ? 'radial-gradient(circle, rgba(0,240,255,0.2) 0%, transparent 70%)'
              : 'rgba(5, 7, 10, 0.4)',
        opacity: isLocked ? 0.3 : 1,
        transformOrigin: 'center center',
        willChange: 'transform',
        transformStyle: 'preserve-3d',
        filter: isReadyToCollapse ? 'brightness(1.4)' : isActiveUserNode ? 'brightness(1.2)' : 'none'
      }}
      initial={false}
      animate={{
        scale: isLocked ? 0.9 : isReadyToCollapse ? [1, 1.04, 1] : 1,
        opacity: isLocked ? 0.3 : 1,
        rotateY: isPopulated ? 360 : 0,
        rotate: 0,
        z: isLocked ? 5 : 15
      }}
      transition={{
        scale: isReadyToCollapse
          ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
          : { delay: isPopulated ? 0 : index * 0.04, type: 'spring', stiffness: 350, damping: 25 },
        delay: isPopulated ? 0 : index * 0.04,
        type: 'spring', stiffness: 350, damping: 25,
        rotateY: { type: 'spring', stiffness: 80, damping: 20 },
        layout: { type: 'spring', bounce: 0.1, duration: 0.5 }
      }}
      whileHover={!isLocked && interactive ? { scale: 1.08, z: 30, filter: 'brightness(1.5)', zIndex: 100 } : {}}
      whileTap={!isLocked && interactive ? { scale: 0.95 } : {}}
      onClick={() => internalNodeTap(node.id, node.x, node.y)}
    >
      {/* Tactical HUD Overlay Elements */}
      {!isLocked && (
        <>
          {/* Coordinate Telemetry */}
          <div className="tactical-hud-text" style={{ position: 'absolute', top: -14, left: 0, opacity: 0.6, fontSize: '0.45rem', whiteSpace: 'nowrap', display: 'flex', gap: '8px' }}>
            <span>[{node.id.toString().padStart(2, '0')}] {node.title.toUpperCase()}</span>
            {typeof readingContextEnv?.location?.lat === 'number' && (
              <span style={{ opacity: 0.7, color: 'var(--eva-cyan)' }}>COORD: {readingContextEnv.location.lat.toFixed(4)}, {readingContextEnv.location.lon?.toFixed(4)}</span>
            )}
            {typeof readingContextEnv?.spaceWeather?.kpIndex === 'number' && (
              <span style={{ opacity: 0.5, color: 'var(--magi-orange)' }}>Kp: {readingContextEnv.spaceWeather.kpIndex.toFixed(2)}</span>
            )}
          </div>

          {/* Corner Brackets */}
          <div style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, pointerEvents: 'none' }}>
            <div className="hud-bracket" style={{ top: 0, left: 0, borderWidth: '1px 0 0 1px', animation: isActiveUserNode ? 'hud-bracket-pulse 1s infinite' : 'none' }} />
            <div className="hud-bracket" style={{ top: 0, right: 0, borderWidth: '1px 1px 0 0', animation: isActiveUserNode ? 'hud-bracket-pulse 1s infinite' : 'none' }} />
            <div className="hud-bracket" style={{ bottom: 0, left: 0, borderWidth: '0 0 1px 1px', animation: isActiveUserNode ? 'hud-bracket-pulse 1s infinite' : 'none' }} />
            <div className="hud-bracket" style={{ bottom: 0, right: 0, borderWidth: '0 1px 1px 0', animation: isActiveUserNode ? 'hud-bracket-pulse 1s infinite' : 'none' }} />
          </div>

          {/* Active Scanning Line */}
          {isActiveUserNode && (
            <motion.div 
              style={{ 
                position: 'absolute', 
                left: 0, 
                width: '100%', 
                height: '2px', 
                background: 'rgba(0, 240, 255, 0.4)', 
                boxShadow: '0 0 10px var(--eva-cyan)',
                zIndex: 20
              }}
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </>
      )}

      {!isPopulated ? (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: '10px',
            height: '100%'
          }}
        >
          <div style={{
            color: isActiveUserNode ? 'var(--eva-cyan)' : 'rgba(255, 255, 255, 0.2)',
            fontFamily: 'monospace',
            fontSize: interactive ? 32 : 24, // Bigger ID for vertical
            fontWeight: 'bold'
          }}>
            {node.id}
          </div>
          {interactive && (
            <div style={{
              color: isReadyToCollapse ? 'var(--magi-orange)' : isActiveUserNode ? 'var(--ghost-white)' : 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.6rem',
              fontFamily: 'monospace',
              textAlign: 'center',
              marginTop: '8px',
              lineHeight: '1.2',
              textTransform: 'uppercase',
              wordBreak: 'break-word'
            }}>
              {isReadyToCollapse ? (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ color: 'var(--magi-orange)', fontSize: '0.55rem', letterSpacing: '1px', fontWeight: 'bold' }}
                >
                  [ COLLAPSE ]<br/>
                  <span style={{ fontSize: '0.4rem', opacity: 0.7 }}>TAP TO DRAW</span>
                </motion.div>
              ) : isActiveUserNode ? (
                <div style={{ color: 'var(--eva-cyan)', animation: 'crt-flicker 2s infinite' }}>
                  <div style={{ fontSize: '0.4rem', color: 'var(--warning-amber)', marginBottom: '2px' }}>[ SUPERPOSITION ]</div>
                  <SuperpositionNoise length={node.title?.length || 8} active={true} />
                </div>
              ) : (
                node.title?.split(' ').join('\n')
              )}
            </div>
          )}
        </div>

      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '10px',
          pointerEvents: 'none',
          position: 'relative',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '0.55rem', color: 'var(--ghost-white)', opacity: 0.5, borderBottom: '1px solid rgba(0,240,255,0.2)', paddingBottom: '4px' }}>
            NODE_{node.id.toString().padStart(3, '0')}
          </div>
          
          <div style={{
            color: 'var(--eva-cyan)',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: '1.4',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 0 10px rgba(0, 240, 255, 0.4)'
          }}>
            {displayedCardName}
          </div>

          <div style={{ fontSize: '0.5rem', color: 'var(--bios-green)', textAlign: 'center', opacity: 1, marginTop: '5px', padding: '2px', border: '1px solid var(--bios-green)' }}>
            [ {platonicTag} LOADED ]
          </div>
        </div>
      )}
    </motion.div>
  );
});

interface SpreadRendererProps {
  spreadId: string;
  nodesRecord: Record<number, string>;
  activeStep?: number;
  onNodeTap?: (id: number, relX: number, relY: number) => void;
  interactive?: boolean;
  isAwaitingTap?: boolean;
}

export const SpreadRenderer: React.FC<SpreadRendererProps> = ({
  spreadId,
  nodesRecord,
  activeStep = 999,
  onNodeTap,
  interactive = true,
  isAwaitingTap = false,
}) => {
  const isGuidedMode = useBoardStore((state) => state.isGuidedMode);

  // Dynamically center all nodes around (0.5, 0.5) to ensure perfect vertical and horizontal alignment
  const currentNodes = React.useMemo(() => {
    const rawNodes = SPREAD_LIBRARY[spreadId]?.nodes || [];
    if (rawNodes.length === 0) return [];
    
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    rawNodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const offsetX = 0.5 - centerX;
    const offsetY = 0.5 - centerY;
    
    return rawNodes.map(node => {
      const centeredX = node.x + offsetX;
      const centeredY = node.y + offsetY;
      // Scale down by 0.85 to keep nodes away from edges
      const scaleFactor = 0.82;
      return {
        ...node,
        x: 0.5 + (centeredX - 0.5) * scaleFactor,
        y: 0.5 + (centeredY - 0.5) * scaleFactor
      };
    });
  }, [spreadId]);

  const [layout, setLayout] = useState({ width: 0, height: 0 });

  // Update SVG/Container dimensions dynamically based on parent sizing
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setLayout({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const internalNodeTap = useCallback((nodeId: number, x: number, y: number) => {
    if (!interactive) return;

    if (isGuidedMode && activeStep !== undefined && nodeId > activeStep) {
      console.warn("Node locked. Please complete the spread sequentially.");
      // Trigger Web Audio API error sfx here later
      return;
    }
    
    // Transmit OSC
    oscRouter.dispatchRigLookAt(nodeId, spreadId, x, y);
    
    if (onNodeTap) onNodeTap(nodeId, x, y);
  }, [interactive, activeStep, spreadId, onNodeTap, isGuidedMode]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
      {layout.width > 0 && layout.height > 0 && (
        <>
          {/* SVG Ley-line Rendering Layer replacing Skia */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
          >
            {currentNodes.map((node, index) => {
              if (index === 0) return null;
              if (interactive && node.id > activeStep) return null;

              const prevNode = currentNodes[index - 1];
              const isLatestLine = interactive && node.id === activeStep;
              
              // Evaluate elemental coloring based on the target node's card
              let strokeColor = "var(--eva-cyan)";
              let mathText = "";
              let mathColor = "var(--eva-cyan)";

              const assignedCard = nodesRecord[node.id];
              const prevCard = nodesRecord[prevNode.id];

              if (assignedCard) {
                 const cardDef = TAROT_DECK_MAP.get(assignedCard.toUpperCase());
                 if (cardDef?.element === 'FIRE') strokeColor = "rgba(255, 102, 0, 0.8)"; // --magi-orange
                 if (cardDef?.element === 'WATER') strokeColor = "rgba(0, 112, 255, 0.8)"; // --vesper-blue
                 if (cardDef?.element === 'EARTH') strokeColor = "rgba(0, 255, 65, 0.8)";  // --eva-green
                 if (cardDef?.element === 'AIR') strokeColor = "rgba(139, 92, 246, 0.8)";  // --magi-violet
                 if (cardDef?.element === 'SPIRIT') strokeColor = "rgba(255, 255, 255, 0.8)"; // ghost-white

                 if (prevCard) {
                    const prevDef = TAROT_DECK_MAP.get(prevCard.toUpperCase());
                    if (prevDef && cardDef) {
                        const e1 = prevDef.element;
                        const e2 = cardDef.element;
                        if ((e1 === 'FIRE' && e2 === 'WATER') || (e1 === 'WATER' && e2 === 'FIRE') ||
                            (e1 === 'AIR' && e2 === 'EARTH') || (e1 === 'EARTH' && e2 === 'AIR')) {
                            mathText = `[ ${e1}/${e2} NEUTRAL ]`;
                            mathColor = "red";
                        } else if (e1 === e2) {
                            mathText = `[ ${e1} RESONANCE ]`;
                            mathColor = "var(--eva-green)";
                        } else if ((e1 === 'FIRE' && e2 === 'AIR') || (e1 === 'AIR' && e2 === 'FIRE')) {
                            mathText = `[ ${e1}/${e2} ACTIVE-SYN ]`;
                            mathColor = "var(--magi-orange)";
                        } else if ((e1 === 'WATER' && e2 === 'EARTH') || (e1 === 'EARTH' && e2 === 'WATER')) {
                            mathText = `[ ${e1}/${e2} PASSIVE-SYN ]`;
                            mathColor = "var(--eva-cyan)";
                        } else {
                            mathText = `[ NEUTRAL BOND ]`;
                            mathColor = "rgba(255,255,255,0.4)";
                        }
                    }
                 }
              }

              const midX = (prevNode.x + node.x) / 2 * layout.width;
              const midY = (prevNode.y + node.y) / 2 * layout.height;
              // Calculate angle to rotate text along the line
              const angle = Math.atan2((node.y - prevNode.y) * layout.height, (node.x - prevNode.x) * layout.width) * 180 / Math.PI;

              return (
                <g key={`path-group-${node.id}`}>
                  {/* Background Solid Line */}
                  <motion.line
                    key={`path-${node.id}`}
                    x1={prevNode.x * layout.width}
                    y1={prevNode.y * layout.height}
                    x2={node.x * layout.width}
                    y2={node.y * layout.height}
                    stroke={strokeColor}
                    strokeWidth={isLatestLine ? "2" : "3"}
                    strokeLinecap="round"
                    opacity={isLatestLine ? 0.3 : (assignedCard ? 0.7 : 0.4)}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: isLatestLine ? 0.3 : (assignedCard ? 0.7 : 0.4), stroke: strokeColor }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                  />
                  {/* Foreground Animated Dashed Line (Flow) */}
                  {isLatestLine && (
                    <>
                      {/* Glow Flow Line */}
                      <motion.line
                        key={`path-flow-glow-${node.id}`}
                        x1={prevNode.x * layout.width}
                        y1={prevNode.y * layout.height}
                        x2={node.x * layout.width}
                        y2={node.y * layout.height}
                        stroke={strokeColor}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray="4 12"
                        initial={{ opacity: 0, strokeDashoffset: 0 }}
                        animate={{ opacity: 0.22, strokeDashoffset: -100 }}
                        transition={{ 
                          opacity: { delay: 1.0, duration: 0.5 },
                          strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: "linear" }
                        }}
                        style={{ willChange: 'transform, opacity' }}
                      />
                      {/* Core Flow Line */}
                      <motion.line
                        key={`path-flow-${node.id}`}
                        x1={prevNode.x * layout.width}
                        y1={prevNode.y * layout.height}
                        x2={node.x * layout.width}
                        y2={node.y * layout.height}
                        stroke={strokeColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="4 12"
                        initial={{ opacity: 0, strokeDashoffset: 0 }}
                        animate={{ opacity: 1, strokeDashoffset: -100 }}
                        transition={{ 
                          opacity: { delay: 1.0, duration: 0.5 },
                          strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: "linear" }
                        }}
                        style={{ willChange: 'transform, opacity' }}
                      />
                    </>
                  )}
                  {mathText && (
                    <motion.text
                      x={midX}
                      y={midY - 6}
                      fill={mathColor}
                      fontSize="0.5rem"
                      fontFamily="monospace"
                      textAnchor="middle"
                      transform={`rotate(${angle > 90 || angle < -90 ? angle + 180 : angle}, ${midX}, ${midY})`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 1 }}
                      style={{ textShadow: `0 0 8px ${mathColor}` }}
                    >
                      {mathText}
                    </motion.text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* HTML Overlay Touchable React Nodes */}
          {currentNodes.map((node, index) => (
            <SpreadNodeOverlay
              key={`node-${node.id}`}
              node={node}
              index={index}
              layout={layout}
              nodesRecord={nodesRecord}
              activeStep={activeStep}
              interactive={interactive}
              isAwaitingTap={isAwaitingTap}
              internalNodeTap={internalNodeTap}
            />
          ))}
        </>
      )}
    </div>
  );
};
