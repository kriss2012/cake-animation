import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Candle({ position, color = '#FFD700', lit = true, onClick }) {
  const flameRef = useRef();
  const flameLightRef = useRef();

  // Gentle flame flicker animation in WebGL
  useFrame((state) => {
    if (lit && flameRef.current) {
      const time = state.clock.elapsedTime;
      const flickerX = 1 + Math.sin(time * 12 + position[0] * 10) * 0.08;
      const flickerY = 1 + Math.cos(time * 18 + position[2] * 10) * 0.12;
      const flickerZ = 1 + Math.sin(time * 15) * 0.08;
      
      flameRef.current.scale.set(flickerX, flickerY, flickerZ);
      
      if (flameLightRef.current) {
        flameLightRef.current.intensity = 0.35 + Math.sin(time * 20) * 0.1;
      }
    }
  });

  return (
    <group position={position} onClick={(e) => {
      e.stopPropagation();
      if (onClick) onClick();
    }}>
      {/* Wax Candle Body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>

      {/* Candle Wick */}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
        <meshStandardMaterial color="#222222" />
      </mesh>

      {/* Flame & Light Source */}
      {lit && (
        <>
          {/* Flame Mesh (tear-drop shape simulated via sphere + custom scaling) */}
          <mesh ref={flameRef} position={[0, 0.28, 0]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial
              color="#ffcc33"
              toneMapped={false}
            />
            
            {/* Outer red/orange flame wrap */}
            <mesh scale={[1.3, 1.8, 1.3]} position={[0, -0.01, 0]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshBasicMaterial 
                color="#ff3300" 
                transparent 
                opacity={0.65} 
                toneMapped={false}
              />
            </mesh>
          </mesh>

          {/* Point light shining on the cake */}
          <pointLight
            ref={flameLightRef}
            position={[0, 0.3, 0]}
            color="#ffaa44"
            intensity={0.4}
            distance={1.2}
            decay={2}
          />
        </>
      )}
    </group>
  );
}
