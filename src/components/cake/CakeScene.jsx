import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CakeModel from './CakeModel';

export default function CakeScene({ 
  flavor = 'chocolate', 
  candles = [], 
  candleStates = [], 
  onCandleClick,
  showSprinkles = true, 
  showCherries = true,
  recipientName = '',
  interactive = true 
}) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 1.8, 3.4], fov: 48 }}
        shadows
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <ambientLight intensity={1.5} />
        
        {/* Soft main key light with shadow support */}
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={2.2} 
          castShadow 
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Subtle helper light */}
        <directionalLight 
          position={[-5, 5, -5]} 
          intensity={0.6} 
        />
        
        {/* Warm bottom stage light */}
        <pointLight
          position={[0, -2, 0]}
          intensity={0.5}
          color="#3b1d60"
        />

        <Suspense fallback={null}>
          <CakeModel
            flavor={flavor}
            candles={candles}
            candleStates={candleStates}
            onCandleClick={onCandleClick}
            showSprinkles={showSprinkles}
            showCherries={showCherries}
            recipientName={recipientName}
          />
        </Suspense>

        {interactive && (
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2 - 0.05} // Lock camera above floor plate
            minDistance={2.2}
            maxDistance={5.0}
            autoRotate={!navigator.maxTouchPoints} // Slowly rotate on desktop automatically for premium feel
            autoRotateSpeed={1.0}
          />
        )}
      </Canvas>

      {/* Orbit interaction help badge */}
      {interactive && (
        <span 
          style={{ 
            position: 'absolute', 
            bottom: '12px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            fontSize: '10px', 
            color: 'rgba(255,255,255,0.4)', 
            textTransform: 'uppercase', 
            letterSpacing: '1.2px',
            pointerEvents: 'none',
            fontWeight: 600
          }}
        >
          🖱️ Click & Drag to Orbit 3D Cake
        </span>
      )}
    </div>
  );
}
