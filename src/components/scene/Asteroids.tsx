"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Asteroid } from "@/services/nasaService";

// Scene-unit constants
// Earth sphere radius = 2.0 units  ≈  6,371 km  →  1 unit ≈ 3,185 km
const EARTH_RADIUS_UNITS = 2.0;
const KM_PER_UNIT = 3185.5;

interface AsteroidsProps {
  data: Asteroid[];
  selectedAsteroid: Asteroid | null;
}

export function Asteroids({ data, selectedAsteroid }: AsteroidsProps) {
  const groupRef = useRef<THREE.Group>(null);

  const asteroidMeshes = useMemo(() => {
    return data.map((asteroid) => {
      const missDistanceKm = parseFloat(
        asteroid.close_approach_data[0]?.miss_distance.kilometers || "100000"
      );
      // Map miss-distance to scene radial position (min 2.5 to avoid clipping Earth)
      const orbitDistance = Math.max(2.5, missDistanceKm / 500_000 + 2.5);

      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * orbitDistance;
      const z = Math.sin(angle) * orbitDistance;
      const y = (Math.random() - 0.5) * 2; // slight orbital inclination

      const sizeKm = asteroid.estimated_diameter.kilometers.estimated_diameter_min;
      // Log scale for visibility while preserving relative sizes
      const size = Math.max(0.03, Math.log10(sizeKm + 1) * 0.1);

      const color = asteroid.is_potentially_hazardous_asteroid ? "#ef4444" : "#94a3b8";

      return { id: asteroid.id, position: new THREE.Vector3(x, y, z), size, color, angle, orbitDistance };
    });
  }, [data]);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0002;
  });

  return (
    <group ref={groupRef}>
      {asteroidMeshes.map((ast) => (
        <group key={ast.id} position={ast.position}>
          <mesh>
            <dodecahedronGeometry args={[ast.size, 1]} />
            <meshStandardMaterial
              color={ast.color}
              roughness={0.9}
              metalness={0.8}
              emissive={ast.color}
              emissiveIntensity={0.1}
              transparent
              opacity={selectedAsteroid ? 0.05 : 1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
