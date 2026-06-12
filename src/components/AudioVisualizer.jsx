import React from 'react';
import { Mic, MicOff } from 'lucide-react';

const AudioVisualizer = ({ volume, isActive, isPermissionDenied }) => {
  const bars = Array.from({ length: 6 });
  
  if (isPermissionDenied) {
    return (
      <div className="mic-error-badge">
        <MicOff size={14} />
        <span>Mic Denied. Click candles instead!</span>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="mic-disabled-badge">
        <MicOff size={14} />
        <span>Mic Off</span>
      </div>
    );
  }

  return (
    <div className="visualizer-badge">
      <div className="flex-center" style={{ gap: '6px', color: '#fbbf24' }}>
        <Mic size={14} className="animate-pulse" />
        <span style={{ fontWeight: 600 }}>Blow:</span>
      </div>
      
      {/* Equalizer Bars */}
      <div className="flex-row" style={{ alignItems: 'flex-end', gap: '3px', height: '14px', width: '32px' }}>
        {bars.map((_, i) => {
          const threshold = i * (100 / bars.length);
          const active = volume > threshold;
          const factor = Math.min(100, Math.max(20, (volume - threshold) * 2.5));
          const height = active ? `${factor}%` : '20%';
          
          let color = '#10b981'; // Green
          if (volume > 85) color = '#f43f5e'; // Red
          else if (volume > 55) color = '#fbbf24'; // Yellow
          
          return (
            <div
              key={i}
              className="transition-all"
              style={{
                width: '3px',
                borderRadius: '4px',
                transitionDuration: '75ms',
                height,
                backgroundColor: active ? color : 'rgba(255, 255, 255, 0.15)'
              }}
            />
          );
        })}
      </div>

      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af', width: '28px', textAlign: 'right' }}>
        {Math.round(volume)}%
      </span>
    </div>
  );
};

export default AudioVisualizer;
