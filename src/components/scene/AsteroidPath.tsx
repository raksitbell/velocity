"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { Asteroid } from "@/services/nasaService";

// Earth radius = 2 scene units ≈ 6,371 km  →  1 unit = 3,185.5 km
const KM_PER_UNIT = 3185.5;
// Max visual asteroid radius (must stay clearly smaller than Earth radius = 2.0)
const MAX_ASTEROID_VISUAL_RADIUS = 0.12;
const MIN_ASTEROID_VISUAL_RADIUS = 0.025;

interface AsteroidPathProps {
  asteroid: Asteroid;
  progress: number; // 0 → 1
  customImpactPoint?: THREE.Vector3 | null;
}

/** Helper: format large numbers in scientific notation e.g. "2.3 × 10¹⁵" */
function sciNotation(n: number): string {
  if (n === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const coeff = (n / Math.pow(10, exp)).toFixed(2);
  const supMap: Record<string, string> = {
    "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴",
    "5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","-":"⁻",
  };
  const expStr = String(exp).split("").map(c => supMap[c] ?? c).join("");
  return `${coeff} × 10${expStr}`;
}

/** Format seconds as m:ss countdown */
function fmtCountdown(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `T−${m}:${String(s % 60).padStart(2, "0")}`;
}

export function AsteroidPath({ asteroid, progress, customImpactPoint }: AsteroidPathProps) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const labelRef    = useRef<THREE.Group>(null);

  // ── Procedural rocky texture (no network request) ──────────────────────────
  const rockTexture = useMemo(() => {
    const size   = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx    = canvas.getContext("2d")!;
    ctx.fillStyle = "#3a3530";
    ctx.fillRect(0, 0, size, size);
    const img  = ctx.getImageData(0, 0, size, size);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = 40 + Math.random() * 70;
      data[i]     = v + (Math.random() > 0.6 ? 8 : 0); // R warm speck
      data[i + 1] = v - 4;
      data[i + 2] = v - 10;
      data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }, []);

  // ── Derived asteroid data ───────────────────────────────────────────────────
  const seed     = asteroid.id.length;
  const endPoint = customImpactPoint ?? new THREE.Vector3(
    Math.cos(seed) * 2.0,
    Math.sin(seed) * 2.0,
    Math.cos(seed + 1) * 2.0
  );

  const { curve, size, velocityKms, massKg } = useMemo(() => {
    const diamKm     = asteroid.estimated_diameter.kilometers.estimated_diameter_max;
    const radiusKm   = diamKm / 2;
    const radiusM    = radiusKm * 1000;
    const volume     = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
    const mass       = volume * 3000; // kg, rocky density 3000 kg/m³

    const kph        = parseFloat(
      asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_hour || "0"
    );
    const vKms       = kph / 3600;

    // Visual size: log-scaled, strictly capped below Earth radius
    const logSize = Math.log10(diamKm + 1) * 0.08;
    const vSize   = Math.max(MIN_ASTEROID_VISUAL_RADIUS, Math.min(MAX_ASTEROID_VISUAL_RADIUS, logSize));

    // Bezier trajectory
    const startX = Math.cos(seed * 2) * 15;
    const startY = (Math.sin(seed * 1.3) - 0.5) * 10;
    const startZ = Math.sin(seed * 2) * 15;
    const start  = new THREE.Vector3(startX, startY, startZ);
    const ctrl   = new THREE.Vector3(
      (startX + endPoint.x) / 2 + 4,
      (startY + endPoint.y) / 2 + 4,
      (startZ + endPoint.z) / 2
    );
    const bezier = new THREE.QuadraticBezierCurve3(start, ctrl, endPoint);

    return { curve: bezier, size: vSize, velocityKms: vKms, massKg: mass };
  }, [asteroid, endPoint, seed]);

  const pathPoints = useMemo(() => curve.getPoints(60), [curve]);

  // ── Animation ───────────────────────────────────────────────────────────────
  useFrame(() => {
    if (progress >= 1) return;
    const pos = curve.getPointAt(Math.min(progress, 0.9999));
    if (asteroidRef.current) {
      asteroidRef.current.position.copy(pos);
      asteroidRef.current.rotation.x += 0.012;
      asteroidRef.current.rotation.y += 0.022;
    }
    if (labelRef.current) labelRef.current.position.copy(pos);
  });

  // Time-to-impact: simulation runs at 0.0001 progress/ms → ~10 s total
  const SIMULATION_TOTAL_S = 10;
  const timeRemainingS     = (1 - progress) * SIMULATION_TOTAL_S;
  const isHazardous        = asteroid.is_potentially_hazardous_asteroid;
  const lineColor          = isHazardous ? "#ef4444" : "#fcd34d";

  return (
    <group>
      {/* Dashed trajectory line */}
      <Line
        points={pathPoints}
        color={lineColor}
        lineWidth={1.5}
        dashed
        dashSize={0.5}
        gapSize={0.25}
        opacity={0.35}
        transparent
      />

      {/* Asteroid mesh + telemetry label */}
      {progress < 1 && (
        <>
          <mesh ref={asteroidRef}>
            <dodecahedronGeometry args={[size, 0]} />
            <meshStandardMaterial
              map={rockTexture}
              roughness={0.93}
              metalness={0.04}
              color="#8c7b6a"
              emissive="#1a1008"
              emissiveIntensity={0.12}
            />
            <pointLight color="#ffbb66" intensity={0.8} distance={6} decay={2} />
          </mesh>

          {/* Floating telemetry HUD — follows the asteroid via labelRef */}
          <group ref={labelRef}>
            <Html
              position={[size * 3, size * 3, 0]}
              center={false}
              style={{ pointerEvents: "none", userSelect: "none" }}
              occlude={false}
            >
              <div
                className="flex flex-col gap-0.5 animate-fadeIn"
                style={{
                  background: "rgba(0,0,0,0.7)",
                  backdropFilter: "blur(8px)",
                  border: `1px solid ${isHazardous ? "rgba(239,68,68,0.5)" : "rgba(252,211,77,0.4)"}`,
                  borderRadius: "6px",
                  padding: "6px 9px",
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#e4e4e7",
                  whiteSpace: "nowrap",
                  minWidth: "130px",
                }}
              >
                {/* Header */}
                <div style={{ color: isHazardous ? "#f87171" : "#fcd34d", fontWeight: 700, fontSize: "8px", letterSpacing: "0.12em", marginBottom: "2px" }}>
                  ◈ {isHazardous ? "HAZARDOUS" : "NEAR-EARTH"} OBJECT
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ color: "#71717a" }}>VELOCITY</span>
                  <span style={{ color: "#67e8f9" }}>{velocityKms.toFixed(1)} km/s</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ color: "#71717a" }}>MASS</span>
                  <span style={{ color: "#a78bfa" }}>{sciNotation(massKg)} kg</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ color: "#71717a" }}>DIAM.</span>
                  <span style={{ color: "#86efac" }}>
                    {asteroid.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2)} km
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "3px",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    paddingTop: "3px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    color: progress > 0.8 ? "#f87171" : "#fbbf24",
                  }}
                >
                  <span>IMPACT</span>
                  <span style={{ fontWeight: 700 }}>{fmtCountdown(timeRemainingS)}</span>
                </div>
              </div>
            </Html>
          </group>
        </>
      )}
    </group>
  );
}
