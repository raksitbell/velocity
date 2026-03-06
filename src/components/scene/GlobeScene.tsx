"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stars } from "@react-three/drei";
import { Earth } from "./Earth";
import { Asteroids } from "./Asteroids";
import { AsteroidPath } from "./AsteroidPath";
import { ImpactEffect } from "./ImpactEffect";
import { TargetMarker } from "./TargetMarker";
import { Asteroid } from "@/services/nasaService";
import * as THREE from "three";

interface GlobeSceneProps {
  asteroids: Asteroid[];
  selectedAsteroid: Asteroid | null;
  progress: number;
  confirmed: boolean;
  customImpactPoint?: THREE.Vector3 | null;
  onPointSelect?: (p: THREE.Vector3) => void;
}

export function GlobeScene({ asteroids, selectedAsteroid, progress, confirmed, customImpactPoint, onPointSelect }: GlobeSceneProps) {
  return (
    <div className="absolute inset-0 z-0 bg-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a0f25] via-[#020513] to-black">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        {/* Basic Lighting */}
        <ambientLight intensity={selectedAsteroid ? 0.05 : 0.2} />
        <directionalLight position={[5, 3, 5]} intensity={2.0} color="#ffffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4338ca" />
        
        {/* Environment Map for reflections on the Earth ocean layer */}
        <Environment preset="city" />

        {/* Scene Objects */}
        {/* Pass onPointSelect only before confirmation so clicks don't move target after launch */}
        <Earth
          onClick={confirmed ? undefined : onPointSelect}
          freezeRotation={progress >= 1}
        >
          {/* Pulsing target crosshair – visible only before impact */}
          {customImpactPoint && !confirmed && (
            <TargetMarker point={customImpactPoint} />
          )}

          {/* ImpactEffect is inside Earth's rotating group so it sticks to the surface */}
          {selectedAsteroid && progress >= 1 && (
            <ImpactEffect
              asteroid={selectedAsteroid}
              impactPoint={customImpactPoint || (() => {
                const seed = selectedAsteroid.id.length;
                return new THREE.Vector3(
                  Math.cos(seed) * 2.0,
                  Math.sin(seed) * 2.0,
                  Math.cos(seed + 1) * 2.0
                );
              })()}
            />
          )}
        </Earth>

        <Asteroids
          data={asteroids}
          selectedAsteroid={selectedAsteroid}
        />

        {/* Targeted trajectory path */}
        {selectedAsteroid && (
          <AsteroidPath
            asteroid={selectedAsteroid}
            progress={progress}
            customImpactPoint={customImpactPoint}
          />
        )}

        {/* Background Stars */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Controls */}
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={300}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
