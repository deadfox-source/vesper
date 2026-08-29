import React from 'react';
import { ScrambleText } from './ScrambleText';
import { VesperGlobalControls } from './VesperGlobalControls';

export interface TelemetryItem {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?: string;
  scramble?: boolean;
}

interface VesperHeaderProps {
  title?: string;
  telemetryData: TelemetryItem[];
  actions?: React.ReactNode;
  accentColor?: string;
  ambientComponent?: React.ReactNode;
}

export const VesperHeader: React.FC<VesperHeaderProps> = ({ title, telemetryData, actions, accentColor = 'var(--eva-cyan)', ambientComponent }) => {
  return (
    <header className="telemetry-header" style={{ 
      width: '100%', 
      height: '75px',
      display: 'flex', 
      flexDirection: 'column',
      padding: '0', // Full width BIOS strip
      borderBottom: `2px solid ${accentColor}`,
      background: 'var(--void-black)',
      position: 'relative',
      zIndex: 100,
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {ambientComponent && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', opacity: 0.3 }}>
          {ambientComponent}
        </div>
      )}
      {/* Top Title Bar (Standard BIOS Style) */}
      {title && (
        <div style={{ 
          background: accentColor, 
          color: 'var(--void-black)', 
          padding: '2px 10px', 
          fontSize: '0.65rem', 
          fontWeight: 'bold', 
          letterSpacing: '2px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '10px' }}>&gt; <ScrambleText text={title.toUpperCase()} duration={1.5} /></div>
          <div style={{ opacity: 0.8, flexShrink: 0 }}>[ BIOS v9.0.2 ]</div>
        </div>
      )}

      {/* Main Telemetry & Actions */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        position: 'relative',
        zIndex: 10,
        padding: '6px 10px'
      }}>
        {/* Left: Telemetry Grid */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'nowrap', 
          gap: '2px', 
          flex: 1,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '4px 10px',
            borderRight: telemetryData.length > 0 ? `1px solid ${accentColor}` : 'none',
            flexShrink: 0
          }}>
            <VesperGlobalControls />
          </div>
          {telemetryData.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '4px 10px', 
              borderRight: idx < telemetryData.length - 1 ? `1px solid ${accentColor}` : 'none',
              opacity: 0.8,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: '0.45rem', opacity: 0.6, letterSpacing: '1px', color: item.color || accentColor, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
              <div className="telemetry" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: item.color || accentColor,
                fontSize: '0.75rem',
                padding: '0',
                background: 'transparent',
                border: 'none',
                overflow: 'hidden'
              }}>
                <div style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</div>
                <span style={{ fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  [{item.scramble && typeof item.value === 'string' ? <ScrambleText text={item.value} duration={1 + idx * 0.2} /> : item.value}]
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
           {actions}
        </div>
      </div>
    </header>
  );
};
