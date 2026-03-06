"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TargetMarkerProps {
  point: THREE.Vector3;
}

/**
 * A glowing target crosshair rendered in 3D, attached to the Earth's surface.
 * Because this is rendered inside Earth's rotating group it always sits on the
 * correct surface position regardless of how the user drags the globe.
 */
export function TargetMarker({ point }: TargetMarkerProps) {
  const groupRef   = useRef<THREE.Group>(null);
  const pulseRef   = useRef<THREE.Mesh>(null);
  const matRef     = useRef<THREE.MeshBasicMaterial>(null);
  const clock      = useRef(0);

  // Orient the marker to face outward from the sphere centre
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    point.clone().normalize()
  );

  useFrame((_, delta) => {
    clock.current += delta;
    const t = (Math.sin(clock.current * 3) + 1) / 2; // 0 → 1 pulse

    if (pulseRef.current) {
      const s = 0.85 + t * 0.25;
      pulseRef.current.scale.setScalar(s);
    }
    if (matRef.current) {
      matRef.current.opacity = 0.35 + t * 0.55;
    }
  });

  const R = 0.045; // ring outer radius (scene units)

  return (
    <group ref={groupRef} position={point} quaternion={quaternion}>
      {/* Outer ring – pulsing */}
      <mesh ref={pulseRef}>
        <ringGeometry args={[R * 0.75, R, 64]} />
        <meshBasicMaterial
          ref={matRef}
          color="#22d3ee"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner dot – solid */}
      <mesh>
        <circleGeometry args={[R * 0.18, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Horizontal crosshair line */}
      <mesh rotation={[0, 0, 0]}>
        <planeGeometry args={[R * 2.4, R * 0.04]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Vertical crosshair line */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[R * 2.4, R * 0.04]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Glow point light */}
      <pointLight color="#22d3ee" intensity={1.5} distance={1.5} decay={2} />
    </group>
  );
}
