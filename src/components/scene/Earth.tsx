"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, useTexture } from "@react-three/drei";
import * as THREE from "three";

interface EarthProps {
  onClick?: (p: THREE.Vector3) => void;
  children?: React.ReactNode;
  freezeRotation?: boolean;
}

export function Earth({ onClick, children, freezeRotation = false }: EarthProps = {}) {
  const groupRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const [colorMap, bumpMap, specularMap, nightMap] = useTexture([
    "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    "https://unpkg.com/three-globe/example/img/earth-topology.png",
    "https://unpkg.com/three-globe/example/img/earth-water.png",
    "https://unpkg.com/three-globe/example/img/earth-night.jpg",
  ]);

  useFrame(() => {
    // Cloud layer drifts very slowly for atmospheric realism
    if (!freezeRotation && cloudRef.current) {
      cloudRef.current.rotation.y += 0.00015;
    }
  });

  return (
    <group ref={groupRef}>

      {/* ── Main photorealistic surface ── */}
      <Sphere args={[2, 128, 128]} onClick={(e) => onClick?.(e.point)}>
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.05}
          roughnessMap={specularMap}
          roughness={0.9}
          metalness={0.02}
          // Night-city lights: keep intensity low so it only shows on the
          // unlit (shadow) hemisphere without bleeding onto the day side.
          emissiveMap={nightMap}
          emissive={new THREE.Color("#ffcc88")}
          emissiveIntensity={0.4}
        />
      </Sphere>

      {/* ── Cloud layer ──
          Radius 2.05 gives enough gap from base sphere to prevent z-fighting.
          polygonOffset pushes it slightly further in clip-space for the same reason.
          We use a uniform low opacity instead of the water map as alphaMap
          (the water map shows ocean, NOT clouds). ── */}
      <Sphere ref={cloudRef} args={[2.05, 64, 64]}>
        <meshStandardMaterial
          color="#d8ecff"
          transparent
          opacity={0.15}
          depthWrite={false}
          roughness={1}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </Sphere>

      {/* ── Children (ImpactEffect, TargetMarker, etc.) ── */}
      {children}

      {/* ── Inner atmospheric haze ── */}
      <Sphere args={[2.08, 64, 64]}>
        <meshPhongMaterial
          color="#1a6fa9"
          transparent
          opacity={0.09}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </Sphere>

      {/* ── Outer limb glow (back-face renders the "halo") ── */}
      <Sphere args={[2.2, 64, 64]}>
        <meshPhongMaterial
          color="#3b91d6"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

    </group>
  );
}
