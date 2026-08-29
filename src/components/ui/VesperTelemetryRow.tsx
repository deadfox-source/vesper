import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cloud, Battery, Globe, Activity, Navigation } from 'lucide-react';
import { useRealTelemetry } from '../../modules/utils/useRealTelemetry';
import { ScrambleText } from './ScrambleText';

export const VesperTelemetryRow: React.FC<{ color?: string }> = ({ color = 'var(--eva-cyan)' }) => {
  const telemetry = useRealTelemetry();

  const items = useMemo(() => {
    const list = [];
    
    if (telemetry.battery.supported && telemetry.battery.level !== null) {
      list.push({ 
        icon: <Battery size={13} />, 
        value: `POWER: ${Math.round(telemetry.battery.level * 100)}% [${telemetry.battery.charging ? 'AC' : 'DC'}]`,
        color: telemetry.battery.charging ? 'var(--warning-amber)' : 'var(--bios-green)'
      });
    } else {
      list.push({ 
        icon: <Activity size={13} />, 
        value: `CORES: ${telemetry.cpu.cores || 'UNKNOWN'}`,
        color: 'var(--magi-violet)'
      });
    }

    if (telemetry.weather.status === 'ONLINE' && telemetry.weather.temp !== null) {
      list.push({ 
        icon: <Cloud size={13} />, 
        value: `TEMP: ${telemetry.weather.temp}°C`,
        color: 'var(--warning-amber)'
      });
    } else {
      list.push({ 
        icon: <Cloud size={13} />, 
        value: `METEO: ${telemetry.weather.status}`,
        color: 'var(--warning-amber)'
      });
    }

    if (telemetry.location && telemetry.location.status === 'ONLINE' && telemetry.location.lat !== null && telemetry.location.lon !== null) {
      list.push({ 
        icon: <Navigation size={13} />, 
        value: `COORD: ${telemetry.location.lat.toFixed(4)}, ${telemetry.location.lon.toFixed(4)}`,
        color: 'var(--eva-cyan)'
      });
    }

    if (telemetry.spaceWeather.status === 'ONLINE' && telemetry.spaceWeather.kpIndex !== null) {
      list.push({ 
        icon: <Globe size={13} />, 
        value: `Kp-INDEX: ${telemetry.spaceWeather.kpIndex.toFixed(2)}`,
        color: 'var(--magi-orange)'
      });
    } else {
      list.push({ 
        icon: <Globe size={13} />, 
        value: `NOAA: ${telemetry.spaceWeather.status}`,
        color: 'var(--magi-orange)'
      });
    }

    list.push({ icon: null, value: '[ LIVE FEED ]', color: color });
    
    return list;
  }, [telemetry, color]);

  // Triplicate the array to create a seamless looping effect
  const tickerItems = [...items, ...items, ...items];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tickerRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const dragStartOffsetRef = useRef<number>(0);
  const lastInteractionRef = useRef<number>(0);

  useEffect(() => {
    let animId: number;
    const speed = 0.55; // pixels per frame (~33px/sec at 60fps)
    const resumeDelay = 2500; // ms

    const tick = () => {
      if (tickerRef.current && containerRef.current) {
        const fullWidth = tickerRef.current.scrollWidth;
        const groupWidth = fullWidth / 3;

        if (groupWidth > 0) {
          if (!isDraggingRef.current && Date.now() - lastInteractionRef.current >= resumeDelay) {
            offsetRef.current -= speed;
            while (offsetRef.current <= -groupWidth) {
              offsetRef.current += groupWidth;
            }
            while (offsetRef.current > 0) {
              offsetRef.current -= groupWidth;
            }
            tickerRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
          }
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    lastInteractionRef.current = Date.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !tickerRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    const groupWidth = tickerRef.current.scrollWidth / 3;

    offsetRef.current = dragStartOffsetRef.current + deltaX;
    if (groupWidth > 0) {
      while (offsetRef.current <= -groupWidth) {
        offsetRef.current += groupWidth;
        dragStartOffsetRef.current += groupWidth;
      }
      while (offsetRef.current > 0) {
        offsetRef.current -= groupWidth;
        dragStartOffsetRef.current -= groupWidth;
      }
    }
    tickerRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    lastInteractionRef.current = Date.now();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      lastInteractionRef.current = Date.now();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        display: 'flex',
        width: '100%',
        background: 'rgba(5, 7, 10, 0.6)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(6px)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: '0.7rem',
        fontFamily: 'monospace',
        letterSpacing: '1.5px',
        boxSizing: 'border-box',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'pan-y'
      }}
    >
      <div
        ref={tickerRef}
        style={{
          display: 'flex',
          width: 'max-content',
          padding: '5px 0',
          willChange: 'transform'
        }}
      >
        {tickerItems.map((item, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            opacity: item.icon ? 0.7 : 0.4, 
            marginRight: '25px',
            color: item.color
          }}>
            {item.icon && <span style={{ opacity: 0.5, display: 'flex' }}>{item.icon}</span>}
            <ScrambleText text={item.value.toUpperCase()} duration={1.2 + (idx % items.length) * 0.1} />
          </div>
        ))}
      </div>
    </div>
  );
};
