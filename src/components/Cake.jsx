import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Cake = ({ 
  flavor = 'chocolate', 
  candleCount = 3, 
  candleStates = [], // array of boolean: true = lit, false = blown
  onCandleClick, 
  showSprinkles = true,
  showCherries = true,
  isBlowing = false 
}) => {

  // Generate stable random positions for sprinkles on each tier
  const sprinkles = useMemo(() => {
    const generateSprinkles = (count, width, height) => {
      const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899', '#ffffff'];
      return Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: `${15 + Math.random() * (width - 30)}px`,
        top: `${5 + Math.random() * (height - 20)}px`,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: `${Math.random() * 360}deg`,
        width: `${3 + Math.random() * 3}px`,
        height: `${6 + Math.random() * 6}px`
      }));
    };

    return {
      tier1: generateSprinkles(40, 320, 50),
      tier2: generateSprinkles(28, 240, 45),
      tier3: generateSprinkles(18, 160, 40)
    };
  }, []);

  // Generate candle positions
  const candles = useMemo(() => {
    return Array.from({ length: candleCount }).map((_, i) => {
      const spacing = 160 / (candleCount + 1);
      const leftPos = spacing * (i + 1);
      // Give each candle a distinct color
      const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#a855f7', '#06b6d4', '#e11d48', '#84cc16'];
      const color = colors[i % colors.length];
      return { id: i, left: `${leftPos}px`, color };
    });
  }, [candleCount]);

  return (
    <div className="cake-stage">
      {/* 3D Cake Stand / Plate */}
      <div className="cake-plate"></div>

      {/* Cake Tiers */}
      <div className="cake-body">
        
        {/* ================= TIER 3 (TOP TIER) ================= */}
        <div className={`cake-tier tier-3 flavor-${flavor}`}>
          {/* Frosting Drip SVG */}
          <svg className="frosting-drips-container" viewBox="0 0 160 40" preserveAspectRatio="none">
            <path className="frosting-drip" d="M 0 0 L 160 0 L 160 12 C 150 20, 140 22, 130 14 C 120 6, 110 5, 100 18 C 90 30, 80 28, 70 14 C 60 -2, 50 14, 40 22 C 30 30, 20 18, 10 16 C 5 15, 0 12, 0 12 Z" />
          </svg>

          {/* Sprinkles Layer */}
          {showSprinkles && (
            <div className="sprinkles-container">
              {sprinkles.tier3.map((s) => (
                <div 
                  key={s.id} 
                  className="sprinkle"
                  style={{
                    left: s.left,
                    top: s.top,
                    backgroundColor: s.color,
                    transform: `rotate(${s.rotation})`,
                    width: s.width,
                    height: s.height
                  }}
                />
              ))}
            </div>
          )}

          {/* Cherry on top of the cake */}
          {showCherries && (
            <div className="cherry" style={{ left: '50%', transform: 'translateX(-50%)', top: '-14px' }}></div>
          )}

          {/* Candles Container - placed on top of Tier 3 */}
          <div className="candles-container">
            {candles.map((candle) => {
              const isLit = candleStates[candle.id];
              return (
                <div
                  key={candle.id}
                  className="interactive-candle"
                  style={{ left: candle.left }}
                  onClick={() => onCandleClick(candle.id)}
                  title={isLit ? "Click to blow out" : "Click to light"}
                >
                  {/* Wax body */}
                  <div className="candle-wax" style={{ backgroundColor: candle.color }}>
                    <div className="candle-wick"></div>
                  </div>

                  {/* Flame / Smoke animation */}
                  <AnimatePresence>
                    {isLit ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={`candle-flame ${isBlowing ? 'flicker' : 'idle'}`}
                      />
                    ) : (
                      <motion.div
                        key={`smoke-${candle.id}`}
                        initial={{ opacity: 0.8, scale: 0.8, y: 0 }}
                        animate={{ opacity: 0, scale: 2.2, y: -40 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className="candle-smoke"
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= TIER 2 (MIDDLE TIER) ================= */}
        <div className={`cake-tier tier-2 flavor-${flavor}`}>
          {/* Frosting Drip SVG */}
          <svg className="frosting-drips-container" viewBox="0 0 240 40" preserveAspectRatio="none">
            <path className="frosting-drip" d="M 0 0 L 240 0 L 240 14 C 230 22, 220 22, 210 14 C 200 6, 190 18, 180 22 C 170 26, 160 14, 150 14 C 140 14, 130 26, 120 26 C 110 26, 100 14, 90 14 C 80 14, 70 22, 60 22 C 50 22, 45 10, 35 14 C 25 18, 15 22, 0 14 Z" />
          </svg>

          {/* Sprinkles Layer */}
          {showSprinkles && (
            <div className="sprinkles-container">
              {sprinkles.tier2.map((s) => (
                <div 
                  key={s.id} 
                  className="sprinkle"
                  style={{
                    left: s.left,
                    top: s.top,
                    backgroundColor: s.color,
                    transform: `rotate(${s.rotation})`,
                    width: s.width,
                    height: s.height
                  }}
                />
              ))}
            </div>
          )}

          {/* Cherries decoration */}
          {showCherries && (
            <>
              <div className="cherry" style={{ left: '20px', top: '-10px' }}></div>
              <div className="cherry" style={{ right: '20px', top: '-10px' }}></div>
            </>
          )}
        </div>

        {/* ================= TIER 1 (BOTTOM TIER) ================= */}
        <div className={`cake-tier tier-1 flavor-${flavor}`}>
          {/* Frosting Drip SVG */}
          <svg className="frosting-drips-container" viewBox="0 0 320 40" preserveAspectRatio="none">
            <path className="frosting-drip" d="M 0 0 L 320 0 L 320 14 C 310 22, 300 22, 290 14 C 280 6, 270 22, 260 22 C 250 22, 240 10, 230 14 C 220 18, 210 26, 200 26 C 190 26, 180 14, 170 14 C 160 14, 150 22, 140 22 C 130 22, 120 10, 110 14 C 100 18, 90 26, 80 26 C 70 26, 60 14, 50 14 C 40 14, 30 22, 20 22 C 10 22, 5 14, 0 14 Z" />
          </svg>

          {/* Sprinkles Layer */}
          {showSprinkles && (
            <div className="sprinkles-container">
              {sprinkles.tier1.map((s) => (
                <div 
                  key={s.id} 
                  className="sprinkle"
                  style={{
                    left: s.left,
                    top: s.top,
                    backgroundColor: s.color,
                    transform: `rotate(${s.rotation})`,
                    width: s.width,
                    height: s.height
                  }}
                />
              ))}
            </div>
          )}

          {/* Cherries decoration */}
          {showCherries && (
            <>
              <div className="cherry" style={{ left: '40px', top: '-10px' }}></div>
              <div className="cherry" style={{ left: '160px', top: '-10px' }}></div>
              <div className="cherry" style={{ right: '40px', top: '-10px' }}></div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Cake;
