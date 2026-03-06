"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { Asteroid } from "@/services/nasaService";
import { calculateImpactMetrics } from "@/lib/impactCalculator";

interface ImpactEffectProps {
  asteroid: Asteroid;
  impactPoint: THREE.Vector3;
}

// ─── Reusable animated ring ─────────────────────────────────────────────────
function AnimatedRing({
  innerRadius,
  outerRadius,
  color,
  targetScale = 1,
  speed = 1,
  maxOpacity = 0.6,
  holdOpacity = 0.45,  // opacity it settles at after expanding
  delay = 0,
}: {
  innerRadius: number;
  outerRadius: number;
  color: string;
  targetScale?: number;
  speed?: number;
  maxOpacity?: number;
  holdOpacity?: number;
  delay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);
  const clock   = useRef(0);

  useFrame((_, delta) => {
    clock.current += delta;
    if (clock.current < delay) return;

    const t       = Math.min(1, (clock.current - delay) * speed);
    const easedT  = 1 - Math.pow(1 - t, 3); // ease-out cubic

    if (meshRef.current) {
      const s = easedT * targetScale;
      meshRef.current.scale.setScalar(Math.max(0.001, s));
    }

    if (matRef.current) {
      if (t < 0.15) {
        // Quick fade-in during burst
        matRef.current.opacity = (t / 0.15) * maxOpacity;
      } else if (t >= 1) {
        // Settled state – keep a dim persistent ring
        matRef.current.opacity = holdOpacity;
      } else {
        matRef.current.opacity = maxOpacity;
      }
    }
  });

  return (
    <mesh ref={meshRef} scale={0.001}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ─── Expanding shockwave pulse ring (thin ring that expands outward) ─────────
function ShockwavePulse({
  color,
  maxRadius,
  speed = 0.7,
  delay = 0,
  thickness = 0.03,
}: {
  color: string;
  maxRadius: number;
  speed?: number;
  delay?: number;
  thickness?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);
  const clock   = useRef(0);

  useFrame((_, delta) => {
    clock.current += delta;
    if (clock.current < delay) return;

    const t      = Math.min(1, (clock.current - delay) * speed);
    const radius = t * maxRadius;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(Math.max(0.001, t));
    }
    if (matRef.current) {
      // Fade out as it expands
      matRef.current.opacity = Math.max(0, (1 - t) * 0.9);
    }
  });

  return (
    <mesh ref={meshRef} scale={0.001}>
      <ringGeometry args={[maxRadius * (1 - thickness), maxRadius, 128]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ─── Particle burst ──────────────────────────────────────────────────────────
function ParticleBurst({ count = 60, spreadRadius = 0.5 }: { count?: number; spreadRadius?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const clock     = useRef(0);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = (Math.random() - 0.5) * Math.PI * 0.6;
      const spd   = 0.3 + Math.random() * 0.7;
      vel[i * 3]     = Math.cos(theta) * Math.cos(phi) * spd;
      vel[i * 3 + 1] = Math.sin(phi) * spd * 0.5;
      vel[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * spd;
      pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0;
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  const geomRef = useRef<THREE.BufferGeometry>(null);

  useFrame((_, delta) => {
    clock.current += delta;
    const t = clock.current;
    if (t > 2) return; // stop updating after 2 seconds

    const pos = geomRef.current?.attributes.position as THREE.BufferAttribute;
    if (!pos) return;

    for (let i = 0; i < count; i++) {
      pos.array[i * 3]     = velocities[i * 3]     * t * spreadRadius;
      pos.array[i * 3 + 1] = velocities[i * 3 + 1] * t * spreadRadius;
      pos.array[i * 3 + 2] = velocities[i * 3 + 2] * t * spreadRadius;
    }
    pos.needsUpdate = true;

    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, 1 - t * 0.7);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ff9944"
        size={0.025}
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthTest={false}
        sizeAttenuation
      />
    </points>
  );
}

// ─── The initial bright flash sphere ─────────────────────────────────────────
function ImpactFlash({ color, duration = 0.5 }: { color: string; duration?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);
  const clock   = useRef(0);

  useFrame((_, delta) => {
    clock.current += delta;
    const t = clock.current / duration;
    if (matRef.current) {
      matRef.current.opacity = Math.max(0, 1 - t * t);
    }
    if (meshRef.current) {
      const s = 0.05 + t * 0.35;
      meshRef.current.scale.setScalar(Math.min(s, 0.4));
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthTest={false}
      />
    </mesh>
  );
}

// ─── Main exported component ─────────────────────────────────────────────────
export function ImpactEffect({ asteroid, impactPoint }: ImpactEffectProps) {
  const metrics = calculateImpactMetrics(asteroid, impactPoint, 2);

  // Snap impact position to just above the sphere surface (radius 2.002)
  // This prevents the rings "floating" when the point was computed at a slightly
  // different radius (e.g. 2.1 fallback), while still avoiding z-fighting.
  const EARTH_R = 2.002;
  const surfacePoint = impactPoint.clone().normalize().multiplyScalar(EARTH_R);

  // Convert km to Three.js scene units (earth radius = 2 units ≈ 6371 km → 1 unit ≈ 3185 km)
  const toVis = (km: number) => Math.min(1.9, km / 3185);

  const fireballR = toVis(metrics.fireballRadiusKm);
  const evacuR    = toVis(metrics.evacuationRadiusKm);
  const craterR   = toVis(metrics.craterDiameterKm / 2);

  // Orient all 2D ring geometry to lie flat on the globe surface at the impact point
  const orientation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    surfacePoint.clone().normalize()
  );

  return (
    <group position={surfacePoint}>
      {/* ── Initial explosive flash ── */}
      <ImpactFlash color="#ffffff" duration={0.35} />
      <ImpactFlash color="#ffaa44" duration={0.55} />
      <ImpactFlash color="#ff4400" duration={0.9}  />

      {/* ── Ongoing orange point light at ground zero ── */}
      <pointLight color="#ff6600" intensity={8} distance={6} decay={2} />

      {/* ── Ejected particle burst ── */}
      <ParticleBurst count={80} spreadRadius={0.6} />

      <group quaternion={orientation}>
        {/* ── Crater scorch ── permanent dark fill */}
        <AnimatedRing
          innerRadius={0}
          outerRadius={Math.max(craterR, 0.006)}
          color="#7c2d12"
          speed={0.6}
          maxOpacity={0.95}
          holdOpacity={0.85}
          delay={0}
        />

        {/* ── Fireball fill (hot red glow) ── */}
        <AnimatedRing
          innerRadius={0}
          outerRadius={fireballR}
          color="#ef4444"
          speed={0.55}
          maxOpacity={0.7}
          holdOpacity={0.4}
          delay={0.08}
        />

        {/* ── Fireball bright edge pulse ── */}
        <ShockwavePulse
          color="#fbbf24"
          maxRadius={fireballR}
          speed={0.8}
          delay={0}
          thickness={0.06}
        />

        {/* ── Orange pressure zone ── */}
        <AnimatedRing
          innerRadius={fireballR * 0.95}
          outerRadius={evacuR}
          color="#ea580c"
          speed={0.45}
          maxOpacity={0.25}
          holdOpacity={0.15}
          delay={0.12}
        />

        {/* ── Primary shockwave ring (cyan) ── */}
        <AnimatedRing
          innerRadius={evacuR * 0.92}
          outerRadius={evacuR}
          color="#22d3ee"
          speed={0.5}
          maxOpacity={0.85}
          holdOpacity={0.5}
          delay={0.15}
        />

        {/* ── Fast-expanding teal pulse ring ── */}
        <ShockwavePulse
          color="#67e8f9"
          maxRadius={evacuR * 1.05}
          speed={0.65}
          delay={0.1}
          thickness={0.04}
        />

        {/* ── Very slow second shockwave that keeps fading ── */}
        <ShockwavePulse
          color="#a5f3fc"
          maxRadius={evacuR * 1.2}
          speed={0.35}
          delay={0.5}
          thickness={0.03}
        />

        {/* ====================================================
            Floating data labels – spread into distinct quadrants
            FIREBALL  → upper-right  (45°)
            SHOCKWAVE → lower-right  (−45°)
            CRATER    → upper-left   (135°)
        ==================================================== */}

        {metrics.fireballRadiusKm > 0 && (
          <Html
            position={[
              fireballR * Math.cos(Math.PI / 4),
              fireballR * Math.sin(Math.PI / 4),
              0.01
            ]}
            center={false}
            style={{ pointerEvents: "none" }}
          >
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <div className="w-10 h-px bg-red-400/70" />
              <div className="bg-black/85 backdrop-blur-md border border-red-500/50 rounded px-2 py-1 text-[9px] font-mono text-red-300 whitespace-nowrap shadow-lg shadow-red-900/30">
                <div className="font-bold uppercase tracking-wider text-red-400">FIREBALL</div>
                <div className="text-zinc-400">{metrics.fireballRadiusKm.toFixed(1)} km radius</div>
              </div>
            </div>
          </Html>
        )}

        {metrics.evacuationRadiusKm > 0 && (
          <Html
            position={[
              evacuR * Math.cos(-Math.PI / 4),
              evacuR * Math.sin(-Math.PI / 4),
              0.02
            ]}
            center={false}
            style={{ pointerEvents: "none" }}
          >
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <div className="w-10 h-px bg-cyan-400/70" />
              <div className="bg-black/85 backdrop-blur-md border border-cyan-500/50 rounded px-2 py-1 text-[9px] font-mono text-cyan-300 whitespace-nowrap shadow-lg shadow-cyan-900/30">
                <div className="font-bold uppercase tracking-wider text-cyan-400">SHOCKWAVE</div>
                <div className="text-zinc-400">{metrics.evacuationRadiusKm.toFixed(1)} km radius</div>
              </div>
            </div>
          </Html>
        )}

        {metrics.craterDiameterKm > 0 && (
          <Html
            position={[
              -Math.max(craterR, fireballR * 0.7) * Math.cos(Math.PI / 4),
               Math.max(craterR, fireballR * 0.7) * Math.sin(Math.PI / 4),
              0.01
            ]}
            center={false}
            style={{ pointerEvents: "none", transform: "translateX(-100%)" }}
          >
            <div className="flex items-center gap-1.5 flex-row-reverse animate-fadeIn">
              <div className="w-10 h-px bg-yellow-500/70" />
              <div className="bg-black/85 backdrop-blur-md border border-yellow-500/50 rounded px-2 py-1 text-[9px] font-mono text-yellow-300 whitespace-nowrap shadow-lg shadow-yellow-900/30">
                <div className="font-bold uppercase tracking-wider text-yellow-400">CRATER</div>
                <div className="text-zinc-400">{metrics.craterDiameterKm.toFixed(2)} km dia.</div>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
