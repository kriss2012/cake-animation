import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { birthdayAudio } from '../utils/audio';

const BALLOON_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#06b6d4', '#f97316', '#ff007f', '#d946ef'
];

const Balloons = ({ count = 6, active = true }) => {
  const [balloons, setBalloons] = useState([]);

  // Helper to generate a single balloon object
  const createBalloon = (id) => {
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const sizeFactor = 0.8 + Math.random() * 0.5; // Scale between 0.8 and 1.3
    return {
      id,
      color,
      left: `${5 + Math.random() * 90}%`, // 5% to 95% width
      speed: `${12 + Math.random() * 12}s`, // Speed between 12s and 24s
      drift: `${-40 + Math.random() * 80}px`,
      size: `${sizeFactor * 60}px`,
      aspectRatio: 1.25
    };
  };

  // Initial balloons spawn
  useEffect(() => {
    if (!active) return;
    const initialBalloons = Array.from({ length: count }).map((_, i) => createBalloon(Date.now() + i));
    setBalloons(initialBalloons);

    // Periodically spawn new balloons
    const interval = setInterval(() => {
      setBalloons(prev => {
        // Keep balloon list clean, remove ones that went out or pop them
        const filtered = prev.filter(b => true); // let CSS animation finish
        if (filtered.length < 15) {
          return [...filtered, createBalloon(Date.now())];
        }
        return filtered;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [active, count]);

  const handlePop = (id, e) => {
    e.stopPropagation();
    // Synthesize pop sound
    birthdayAudio.playPop();
    // Remove popped balloon
    setBalloons(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="balloon-container">
      <AnimatePresence>
        {balloons.map((b) => (
          <div
            key={b.id}
            className="balloon"
            onClick={(e) => handlePop(b.id, e)}
            style={{
              left: b.left,
              backgroundColor: b.color,
              '--color': b.color,
              '--speed': b.speed,
              '--drift': b.drift,
              width: b.size,
              height: `calc(${b.size} * 1.25)`,
              zIndex: 5
            }}
          >
            {/* Balloon shine highlighting */}
            <div 
              className="absolute w-2.5 h-6 bg-white/30 rounded-full top-3 left-3"
              style={{ transform: 'rotate(-25deg)' }}
            />
            {/* Balloon string */}
            <div className="balloon-string" />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Balloons;
