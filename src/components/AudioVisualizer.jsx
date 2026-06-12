import React from 'react';
import { Mic, MicOff } from 'lucide-react';

const AudioVisualizer = ({ volume, isActive, isPermissionDenied }) => {
  // volume is expected to be 0 to 100
  // Normalize volume for styling
  const bars = Array.from({ length: 6 });
  
  if (isPermissionDenied) {
    return (
      <div className="flex items-center gap-2 bg-red-950/20 border border-red-900/30 px-3 py-1.5 rounded-full text-xs text-red-400">
        <MicOff size={14} />
        <span>Mic Permission Denied. Click candles instead!</span>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs text-gray-400">
        <MicOff size={14} />
        <span>Mic Blow Mode Disabled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-amber-400/5 border border-amber-400/20 px-4 py-2 rounded-full text-xs">
      <div className="flex items-center gap-1.5 text-amber-400">
        <Mic size={14} className="animate-pulse" />
        <span className="font-semibold">Blow Level:</span>
      </div>
      
      {/* Equalizer Bars */}
      <div className="flex items-end gap-1 h-3.5 w-16">
        {bars.map((_, i) => {
          // Calculate height based on volume
          // Each bar responds to a specific range of volume
          const threshold = i * (100 / bars.length);
          const active = volume > threshold;
          // Scale factor
          const factor = Math.min(100, Math.max(15, (volume - threshold) * 2));
          const height = active ? `${factor}%` : '20%';
          const color = volume > 80 ? 'bg-red-400' : volume > 50 ? 'bg-amber-400' : 'bg-green-400';
          
          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${active ? color : 'bg-gray-700'}`}
              style={{ height }}
            />
          );
        })}
      </div>

      <span className="font-mono text-[10px] text-gray-400 w-6 text-right">
        {Math.round(volume)}%
      </span>
    </div>
  );
};

export default AudioVisualizer;
