import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import Candle from './Candle';

// Flavor color mappings
const FLAVOR_COLORS = {
  chocolate: { cake: '#4a2c27', frosting: '#281512', text: '#fff' },
  strawberry: { cake: '#ff8ca3', frosting: '#b81232', text: '#fff' },
  vanilla: { cake: '#eddcc4', frosting: '#fffdf2', text: '#5c3f37' },
  redvelvet: { cake: '#8c0c13', frosting: '#f7f6f0', text: '#8c0c13' }
};

export default function CakeModel({ 
  flavor = 'chocolate', 
  candles = [], 
  candleStates = [], 
  onCandleClick,
  showSprinkles = true, 
  showCherries = true,
  recipientName = ''
}) {
  const groupRef = useRef();
  
  // Gentle cake bobbing and auto-rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.04 - 0.1;
    }
  });

  const colors = FLAVOR_COLORS[flavor] || FLAVOR_COLORS.chocolate;

  // Generate stable random sprinkles positions
  const sprinkles = useMemo(() => {
    const generateSprinkles = (count, radiusMin, radiusMax, height) => {
      const arr = [];
      const sprinkleColors = ['#fbbf24', '#f43f5e', '#3b82f6', '#10b981', '#ec4899', '#ffffff'];
      for (let i = 0; i < count; i++) {
        const r = radiusMin + Math.random() * (radiusMax - radiusMin);
        const theta = Math.random() * Math.PI * 2;
        arr.push({
          position: [r * Math.cos(theta), height, r * Math.sin(theta)],
          color: sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)],
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0]
        });
      }
      return arr;
    };

    return [
      ...generateSprinkles(showSprinkles ? 40 : 0, 0.9, 1.4, -0.31), // Tier 1 surface
      ...generateSprinkles(showSprinkles ? 30 : 0, 0.5, 1.0, 0.21),  // Tier 2 surface
      ...generateSprinkles(showSprinkles ? 20 : 0, 0.1, 0.6, 0.68)   // Tier 3 surface
    ];
  }, [showSprinkles]);

  // Cherries placements
  const cherries = useMemo(() => {
    const arr = [];
    if (!showCherries) return arr;

    // Top center cherry
    arr.push({ position: [0, 0.73, 0], scale: 0.14 });

    // Tier 2 edge cherries (4 items)
    for (let i = 0; i < 4; i++) {
      const theta = (i * Math.PI * 2) / 4;
      arr.push({ position: [1.02 * Math.cos(theta), 0.22, 1.02 * Math.sin(theta)], scale: 0.1 });
    }

    // Tier 1 edge cherries (6 items)
    for (let i = 0; i < 6; i++) {
      const theta = (i * Math.PI * 2) / 6 + Math.PI / 6;
      arr.push({ position: [1.42 * Math.cos(theta), -0.3, 1.42 * Math.sin(theta)], scale: 0.1 });
    }

    return arr;
  }, [showCherries]);

  // Candle circular geometry mapping
  const candleLayout = useMemo(() => {
    return Array.from({ length: candles.length }).map((_, i) => {
      const radius = 0.25; // placed on Tier 3 top surface
      const angle = (i * Math.PI * 2) / candles.length;
      return {
        x: radius * Math.cos(angle),
        z: radius * Math.sin(angle),
        color: ['#fbbf24', '#f43f5e', '#3b82f6', '#10b981', '#a855f7', '#06b6d4'][i % 6]
      };
    });
  }, [candles.length]);

  return (
    <group ref={groupRef} position={[0, -0.1, 0]} dispose={null}>
      
      {/* ================= CAKE PLATE ================= */}
      <mesh position={[0, -0.65, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.7, 1.8, 0.08, 64]} />
        <meshStandardMaterial color="#f3f4f6" roughness={0.1} metalness={0.05} />
      </mesh>
      
      {/* Plate silver rim */}
      <mesh position={[0, -0.61, 0]}>
        <torusGeometry args={[1.72, 0.02, 12, 64]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* ================= TIER 1 (BOTTOM) ================= */}
      {/* Cake Body */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.35, 64]} />
        <meshStandardMaterial color={colors.cake} roughness={0.75} />
      </mesh>
      {/* Frosting Layer */}
      <mesh position={[0, -0.32, 0]} castShadow>
        <cylinderGeometry args={[1.52, 1.52, 0.06, 64]} />
        <meshStandardMaterial color={colors.frosting} roughness={0.4} />
      </mesh>

      {/* ================= TIER 2 (MIDDLE) ================= */}
      {/* Cake Body */}
      <mesh position={[0, 0.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.38, 64]} />
        <meshStandardMaterial color={colors.cake} roughness={0.75} />
      </mesh>
      {/* Frosting Layer */}
      <mesh position={[0, 0.20, 0]} castShadow>
        <cylinderGeometry args={[1.12, 1.12, 0.06, 64]} />
        <meshStandardMaterial color={colors.frosting} roughness={0.4} />
      </mesh>

      {/* ================= TIER 3 (TOP) ================= */}
      {/* Cake Body */}
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.35, 64]} />
        <meshStandardMaterial color={colors.cake} roughness={0.75} />
      </mesh>
      {/* Frosting Layer */}
      <mesh position={[0, 0.67, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.72, 0.06, 64]} />
        <meshStandardMaterial color={colors.frosting} roughness={0.4} />
      </mesh>

      {/* ================= TOP TEXT (CURSIVE NAME) ================= */}
      {recipientName && (
        <Text
          position={[0, 0.702, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.095}
          color={colors.text}
          font="https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qhl-LndI48p57FBA.woff"
          anchorX="center"
          anchorY="middle"
          depthOffset={1}
        >
          {recipientName}
        </Text>
      )}

      {/* ================= SPRINKLES ================= */}
      {sprinkles.map((sp, idx) => (
        <mesh key={`spr-${idx}`} position={sp.position} rotation={sp.rotation}>
          <boxGeometry args={[0.015, 0.015, 0.05]} />
          <meshStandardMaterial color={sp.color} roughness={0.2} />
        </mesh>
      ))}

      {/* ================= CHERRIES ================= */}
      {cherries.map((cherry, idx) => (
        <group key={`ch-${idx}`} position={cherry.position}>
          {/* Cherry Ball */}
          <mesh castShadow>
            <sphereGeometry args={[cherry.scale, 32, 32]} />
            <meshStandardMaterial 
              color="#bf0a19" 
              roughness={0.05} 
              metalness={0.2} 
            />
          </mesh>
          
          {/* Stem (green wire) */}
          <mesh position={[0.02, cherry.scale + 0.06, 0.02]} rotation={[0, 0, 0.35]}>
            <cylinderGeometry args={[0.005, 0.005, 0.12, 8]} />
            <meshStandardMaterial color="#4d7c0f" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ================= CANDLES ================= */}
      {candleLayout.map((c, idx) => (
        <Candle
          key={candles[idx]?.id || idx}
          position={[c.x, 0.88, c.z]} // sits on top tier
          color={c.color}
          lit={candleStates[idx] !== false}
          onClick={() => {
            if (onCandleClick) onCandleClick(idx);
          }}
        />
      ))}

    </group>
  );
}
