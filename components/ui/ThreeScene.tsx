"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, Stars, MeshDistortMaterial, PerspectiveCamera } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function TechShape() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.8}>
        <MeshDistortMaterial
          color="#E30613"
          attach="material"
          distort={0.4}
          speed={3}
          roughness={0}
          emissive="#2a0a0a"
          metalness={1}
        />
      </Sphere>
    </Float>
  );
}

function Particles({ count = 200 }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        p[i * 3] = (Math.random() - 0.5) * 10;
        p[i * 3 + 1] = (Math.random() - 0.5) * 10;
        p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.4} />
    </points>
  );
}

export default function ThreeScene() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#E30613" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4f46e5" />
        
        <TechShape />
        <Particles count={500} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  );
}
