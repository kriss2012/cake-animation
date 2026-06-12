import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { birthdayAudio } from '../utils/audio';

// Color themes for cake flavors
const THEMES = {
  chocolate: {
    cake: '#4a2c27',
    icing: '#2b1714',
    sprinkles: ['#fbbf24', '#f43f5e', '#60a5fa', '#34d399', '#ffffff']
  },
  strawberry: {
    cake: '#ff7e95',
    icing: '#c91a3b',
    sprinkles: ['#ffffff', '#fbbf24', '#3b82f6', '#10b981', '#f472b6']
  },
  vanilla: {
    cake: '#eddcc4',
    icing: '#fffdf2',
    sprinkles: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']
  },
  redvelvet: {
    cake: '#8c0c13',
    icing: '#fcfbfa', // cream cheese frosting
    sprinkles: ['#8c0c13', '#d97706', '#10b981', '#2563eb', '#ffffff']
  }
};

const ThreeDCylinder = ({ diameter, height, cakeColor, icingColor, rotationY, segments = 12, drips = true, sprinkles = [] }) => {
  const radius = diameter / 2;
  // Panel width fits the segments of a circle: w = 2 * r * sin(pi / segments)
  const panelWidth = diameter * Math.sin(Math.PI / segments) + 1; // 1px overlap to avoid gaps
  const panelRadius = radius * Math.cos(Math.PI / segments);
  const angleStep = 360 / segments;

  return (
    <div style={{
      width: diameter,
      height: height,
      position: 'relative',
      transformStyle: 'preserve-3d',
    }}>
      {/* Top Face (Frosting surface) */}
      <div 
        className="absolute rounded-full" 
        style={{
          width: diameter,
          height: diameter,
          backgroundColor: icingColor,
          transform: `rotateX(90deg) translateZ(${height / 2}px)`,
          top: -radius + height / 2,
          left: 0,
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.15)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Sprinkles on top surface */}
        {sprinkles.map((s, idx) => (
          <div
            key={idx}
            className="absolute rounded-full"
            style={{
              left: `${s.x + radius}px`,
              top: `${s.y + radius}px`,
              width: s.size,
              height: `${s.size * 2.5}px`,
              backgroundColor: s.color,
              transform: `translateZ(1px) rotate(${s.angle}deg)`,
              transformOrigin: 'center center',
              opacity: 0.9
            }}
          />
        ))}
      </div>

      {/* Bottom Face */}
      <div 
        className="absolute rounded-full" 
        style={{
          width: diameter,
          height: diameter,
          backgroundColor: cakeColor,
          transform: `rotateX(90deg) translateZ(${-height / 2}px)`,
          top: -radius + height / 2,
          left: 0,
        }}
      />

      {/* Side Segments forming a cylinder */}
      {Array.from({ length: segments }).map((_, i) => {
        const angle = i * angleStep;
        
        // Calculate lighting based Y-rotation to simulate light source from front-left
        // Add rotationY to keep lighting stable as cylinder spins!
        const totalAngleRad = ((angle + rotationY) * Math.PI) / 180;
        const lightIntensity = 0.45 + 0.55 * Math.cos(totalAngleRad - Math.PI / 4);
        
        // Dynamic shading gradients
        const shade = `rgba(0, 0, 0, ${0.45 - 0.4 * lightIntensity})`;
        const specular = `rgba(255, 255, 255, ${0.08 * lightIntensity})`;

        // Alternating drips heights
        const dripHeight = i % 3 === 0 ? 15 : i % 2 === 0 ? 25 : 8;

        return (
          <div
            key={i}
            className="absolute top-0"
            style={{
              width: panelWidth,
              height: height,
              left: (diameter - panelWidth) / 2,
              transform: `rotateY(${angle}deg) translateZ(${panelRadius - 0.2}px)`,
              backgroundColor: cakeColor,
              backgroundImage: `linear-gradient(to right, ${shade}, ${specular}, ${shade})`,
              transformOrigin: 'center center',
              backfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Frosting drips on side */}
            {drips && (
              <>
                {/* Upper drip collar */}
                <div 
                  className="absolute top-0 left-0 w-full" 
                  style={{
                    height: `${dripHeight}px`,
                    backgroundColor: icingColor,
                    borderRadius: '0 0 4px 4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                />
                {/* Organic drip drop */}
                {i % 2 === 0 && dripHeight > 10 && (
                  <div 
                    className="absolute rounded-full"
                    style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: icingColor,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      top: `${dripHeight - 1}px`,
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

const Cake = ({ 
  flavor = 'chocolate', 
  candleCount = 3, 
  candleStates = [], 
  onCandleClick, 
  showSprinkles = true,
  showCherries = true,
  isBlowing = false 
}) => {
  const [rotationY, setRotationY] = useState(-30);
  const [autoSpin, setAutoSpin] = useState(true);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const lastRotationRef = useRef(-30);

  // Auto Spin loop
  useEffect(() => {
    let animId;
    const spin = () => {
      if (autoSpin && !isDraggingRef.current) {
        setRotationY(prev => (prev + 0.25) % 360);
      }
      animId = requestAnimationFrame(spin);
    };
    animId = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animId);
  }, [autoSpin]);

  // Drag handlers
  const handleStartDrag = (e) => {
    isDraggingRef.current = true;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    dragStartXRef.current = clientX;
    lastRotationRef.current = rotationY;
    setAutoSpin(false); // Pause auto-spin on drag
  };

  const handleDrag = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const deltaX = clientX - dragStartXRef.current;
    // Drag rotation sensitivity: 0.5 degrees per pixel
    setRotationY(lastRotationRef.current + deltaX * 0.6);
  };

  const handleEndDrag = () => {
    isDraggingRef.current = false;
    // Resume auto-spin after 2 seconds of inactivity
    setTimeout(() => {
      if (!isDraggingRef.current) {
        setAutoSpin(true);
      }
    }, 2000);
  };

  // Bind global mouse events for smooth drag release outside bounds
  useEffect(() => {
    const handleGlobalMove = (e) => handleDrag(e);
    const handleGlobalUp = () => handleEndDrag();

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: true });
    window.addEventListener('touchend', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [rotationY]);

  const theme = THEMES[flavor] || THEMES.chocolate;

  // Generate stable random sprinkles coordinates inside circular surfaces
  const sprinkles = useMemo(() => {
    const generateCircSprinkles = (count, maxRadius, colors) => {
      return Array.from({ length: count }).map(() => {
        // Uniform circular distribution
        const r = Math.sqrt(Math.random()) * maxRadius;
        const angle = Math.random() * 2 * Math.PI;
        return {
          x: r * Math.cos(angle),
          y: r * Math.sin(angle),
          size: 3 + Math.random() * 2,
          angle: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)]
        };
      });
    };

    return {
      tier1: generateCircSprinkles(showSprinkles ? 35 : 0, 115, theme.sprinkles),
      tier2: generateCircSprinkles(showSprinkles ? 25 : 0, 80, theme.sprinkles),
      tier3: generateCircSprinkles(showSprinkles ? 15 : 0, 48, theme.sprinkles)
    };
  }, [flavor, showSprinkles]);

  // Cherries placement positions
  const cherries = useMemo(() => {
    const makeCherries = (radius, count) => {
      return Array.from({ length: count }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / count;
        return {
          x: radius * Math.cos(angle),
          z: radius * Math.sin(angle),
          angleDeg: (angle * 180) / Math.PI
        };
      });
    };

    return {
      topCenter: showCherries ? [{ x: 0, z: 0 }] : [],
      tier2: showCherries ? makeCherries(82, 4) : [], // 4 cherries around Tier 2
      tier1: showCherries ? makeCherries(118, 6) : []  // 6 cherries around Tier 1
    };
  }, [showCherries]);

  // 3D Candle positioning on Tier 3 top surface
  const candles = useMemo(() => {
    return Array.from({ length: candleCount }).map((_, i) => {
      const radius = 38; // Circular ring radius
      const angle = (i * 2 * Math.PI) / candleCount;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#a855f7', '#06b6d4', '#e11d48'];
      const waxColor = colors[i % colors.length];

      return {
        id: i,
        x,
        z,
        angleDeg: (angle * 180) / Math.PI,
        waxColor
      };
    });
  }, [candleCount]);

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* 3D Scene Wrapper */}
      <div 
        className="cake-scene-container"
        onMouseDown={handleStartDrag}
        onTouchStart={handleStartDrag}
      >
        <div 
          className="cake-scene-3d"
          style={{
            transform: `rotateX(-18deg) rotateY(${rotationY}deg)`,
            // Sits center
          }}
        >
          {/* ================= 3D CAKE PLATE ================= */}
          <div style={{ transform: 'translate3d(0, 75px, 0)', transformStyle: 'preserve-3d' }}>
            <ThreeDCylinder
              diameter={290}
              height={14}
              cakeColor="#e2e8f0"
              icingColor="#ffffff"
              rotationY={rotationY}
              segments={16}
              drips={false}
            />
          </div>

          {/* ================= 3D TIER 1 (BOTTOM) ================= */}
          <div style={{ transform: 'translate3d(0, 32px, 0)', transformStyle: 'preserve-3d' }}>
            <ThreeDCylinder
              diameter={250}
              height={75}
              cakeColor={theme.cake}
              icingColor={theme.icing}
              rotationY={rotationY}
              segments={12}
              sprinkles={sprinkles.tier1}
            />
          </div>

          {/* Cherries on Tier 1 top edge */}
          {cherries.tier1.map((cherry, i) => (
            <div
              key={`c1-${i}`}
              className="cherry"
              style={{
                position: 'absolute',
                top: '-5px',
                transformStyle: 'preserve-3d',
                // Offset radially
                transform: `translate3d(${cherry.x}px, 0px, ${cherry.z}px) scale(0.7)`,
              }}
            />
          ))}

          {/* ================= 3D TIER 2 (MIDDLE) ================= */}
          <div style={{ transform: 'translate3d(0, -38px, 0)', transformStyle: 'preserve-3d' }}>
            <ThreeDCylinder
              diameter={180}
              height={65}
              cakeColor={theme.cake}
              icingColor={theme.icing}
              rotationY={rotationY}
              segments={12}
              sprinkles={sprinkles.tier2}
            />
          </div>

          {/* Cherries on Tier 2 top edge */}
          {cherries.tier2.map((cherry, i) => (
            <div
              key={`c2-${i}`}
              className="cherry"
              style={{
                position: 'absolute',
                top: '-72px',
                transformStyle: 'preserve-3d',
                transform: `translate3d(${cherry.x}px, 0px, ${cherry.z}px) scale(0.7)`,
              }}
            />
          ))}

          {/* ================= 3D TIER 3 (TOP) ================= */}
          <div style={{ transform: 'translate3d(0, -98px, 0)', transformStyle: 'preserve-3d' }}>
            <ThreeDCylinder
              diameter={110}
              height={55}
              cakeColor={theme.cake}
              icingColor={theme.icing}
              rotationY={rotationY}
              segments={12}
              sprinkles={sprinkles.tier3}
            />
          </div>

          {/* Center cherry on top of Tier 3 */}
          {cherries.topCenter.map((cherry, i) => (
            <div
              key={`c3-${i}`}
              className="cherry"
              style={{
                position: 'absolute',
                top: '-138px',
                transformStyle: 'preserve-3d',
                transform: 'translate3d(0, 0, 0) scale(0.95)',
              }}
            />
          ))}

          {/* ================= 3D CANDLES LAYER ================= */}
          {candles.map((candle) => {
            const isLit = candleStates[candle.id];
            
            // Positioning of each candle cylinder
            // Tier 3 top surface height is at translate3d(0, -125px, 0)
            const candleY = -125; 

            return (
              <div
                key={candle.id}
                style={{
                  position: 'absolute',
                  top: `${candleY}px`,
                  transform: `translate3d(${candle.x}px, 0, ${candle.z}px)`,
                  transformStyle: 'preserve-3d',
                  width: '8px',
                  height: '42px',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCandleClick(candle.id);
                }}
              >
                {/* 3D Candle Cylinder */}
                <ThreeDCylinder
                  diameter={8}
                  height={38}
                  cakeColor={candle.waxColor}
                  icingColor={candle.waxColor}
                  rotationY={rotationY}
                  segments={6}
                  drips={false}
                />
                
                {/* Wick */}
                <div 
                  className="candle-wick"
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    left: '3px',
                    width: '1.5px',
                    height: '8px',
                    backgroundColor: '#111',
                    transform: 'translateZ(0px)'
                  }}
                />

                {/* Flame with Camera Counter-Rotation (Billboarding) */}
                {/* We counter-rotate Y by -rotationY so the flame always faces flat to screen! */}
                <AnimatePresence>
                  {isLit ? (
                    <motion.div
                      key={`flame-${candle.id}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`candle-flame ${isBlowing ? 'flicker' : 'idle'}`}
                      style={{
                        bottom: '43px',
                        left: '-4px', // Centering
                        transform: `rotateY(${-rotationY}deg)`, // Billboard effect!
                      }}
                    />
                  ) : (
                    <motion.div
                      key={`smoke-${candle.id}`}
                      initial={{ opacity: 0.8, scale: 0.5, y: 0 }}
                      animate={{ opacity: 0, scale: 2, y: -30 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="candle-smoke"
                      style={{
                        bottom: '42px',
                        left: '2px',
                        transform: `rotateY(${-rotationY}deg)`,
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          })}

        </div>
      </div>
      
      {/* 3D Helper controls indicator */}
      <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mb-2 flex items-center gap-1.5 opacity-60">
        🖱️ Click & Drag cake to rotate in 3D
      </span>
    </div>
  );
};

export default Cake;
