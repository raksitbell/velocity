"use client";

import { Asteroid } from "@/services/nasaService";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Thermometer, Orbit, Mountain, AlertCircle } from "lucide-react";

interface FlightTelemetryHUDProps {
  selectedAsteroid: Asteroid;
  progress: number;
  /** Optional: absolute screen position of the asteroid dot. When provided the HUD floats next to it. */
  asteroidScreenPos?: { x: number; y: number } | null;
}

export function FlightTelemetryHUD({ selectedAsteroid, progress, asteroidScreenPos }: FlightTelemetryHUDProps) {
  // Only render during actual flight
  if (progress <= 0 || progress >= 1) return null;

  // ── Physics Calculations ──────────────────────────────────
  // Velocity: NASA returns km/h; convert to km/s, then add gravitational acceleration pseudo-effect
  const startingVelocityKps = parseFloat(
    selectedAsteroid.close_approach_data[0]?.relative_velocity.kilometers_per_hour || "54000"
  ) / 3600;
  const currentVelocity = startingVelocityKps + progress * 5.2;

  // Diameter in meters (NASA returns kilometers)
  const estDiamMin = selectedAsteroid.estimated_diameter.kilometers.estimated_diameter_min * 1000;
  const estDiamMax = selectedAsteroid.estimated_diameter.kilometers.estimated_diameter_max * 1000;
  const avgDiamMeters = (estDiamMin + estDiamMax) / 2;

  // Mass: spherical chondrite density ~3000 kg/m³
  const volume = (4 / 3) * Math.PI * Math.pow(avgDiamMeters / 2, 3);
  const massKg = volume * 3000;

  // Altitude: starts at Lunar distance (384,400 km), reaches 0 at progress=1
  const MAX_ALTITUDE = 384400;
  const currentAltitude = MAX_ALTITUDE * (1 - progress);

  // Hull temperature: space is ~-270°C, heats on atmospheric entry (Kármán line: 100 km)
  let shellTemp = -270;
  if (currentAltitude <= 100) {
    const penetrationScale = 1 - currentAltitude / 100;
    shellTemp = -270 + penetrationScale * 2500;
  }

  const isEnteringAtmosphere = currentAltitude <= 100;

  const displayMass =
    massKg > 1e9
      ? (massKg / 1e9).toFixed(1) + " Gt"
      : massKg > 1e6
      ? (massKg / 1e6).toFixed(1) + " Mt"
      : (massKg / 1e3).toFixed(1) + " Kt";

  // ── Positioning ───────────────────────────────────────────
  // If we have the asteroid's screen coordinates, float the HUD to the right of it.
  // Otherwise fall back to fixed left position.
  const OFFSET_X = 20; // px gap to the right of the dot
  const OFFSET_Y = -80; // shift up a little so the HUD sits above-right of the dot

  const positionStyle =
    asteroidScreenPos
      ? {
          position: "fixed" as const,
          left: `${asteroidScreenPos.x + OFFSET_X}px`,
          top: `${asteroidScreenPos.y + OFFSET_Y}px`,
          // Clamp inside viewport
          maxWidth: "240px",
        }
      : {
          position: "fixed" as const,
          top: "6rem",
          left: "1.5rem",
        };

  return (
    <AnimatePresence>
      <motion.div
        key="hud"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.25 }}
        style={{ ...positionStyle, zIndex: 50, pointerEvents: "none" }}
      >
        {/* Atmospheric Entry Warning */}
        <AnimatePresence>
          {isEnteringAtmosphere && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 bg-red-500/20 text-red-400 border border-red-500/50 backdrop-blur-md px-3 py-2 rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" />
              <div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-red-300">⚠ Hazard</div>
                <div className="font-mono text-[10px] leading-tight font-bold">ATM. ENTRY</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Telemetry Card */}
        <div className="bg-black/70 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-2xl w-52">
          <div className="text-cyan-400 text-[9px] font-bold tracking-[0.2em] mb-3 border-b border-cyan-500/20 pb-1.5 uppercase flex items-center justify-between">
            Live Telemetry
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          </div>

          <div className="space-y-2.5">
            {/* Altitude */}
            <Row
              icon={<Mountain className="w-3.5 h-3.5" />}
              label="Altitude"
              value={
                currentAltitude >= 1000
                  ? `${currentAltitude.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`
                  : `${currentAltitude.toFixed(1)} km`
              }
              danger={currentAltitude < 100}
            />
            {/* Velocity */}
            <Row
              icon={<Activity className="w-3.5 h-3.5" />}
              label="Velocity"
              value={`${currentVelocity.toFixed(2)} km/s`}
              color="text-cyan-300"
            />
            {/* Mass */}
            <Row
              icon={<Orbit className="w-3.5 h-3.5" />}
              label="Mass"
              value={displayMass}
            />
            {/* Hull Temp */}
            <Row
              icon={<Thermometer className="w-3.5 h-3.5" />}
              label="Hull Temp"
              value={`${shellTemp.toFixed(0)}°C`}
              color={shellTemp > 0 ? "text-orange-400" : "text-blue-300"}
            />
          </div>
        </div>

        {/* Connector line toward asteroid dot when anchored */}
        {asteroidScreenPos && (
          <svg
            style={{
              position: "fixed",
              left: asteroidScreenPos.x - 2,
              top: asteroidScreenPos.y + OFFSET_Y + 60,
              pointerEvents: "none",
              overflow: "visible",
            }}
            width={OFFSET_X + 4}
            height={Math.abs(OFFSET_Y) - 60}
          >
            <line
              x1={0}
              y1={Math.abs(OFFSET_Y) - 60}
              x2={0}
              y2={0}
              stroke="#06b6d4"
              strokeWidth={1}
              strokeOpacity={0.5}
              strokeDasharray="3,3"
            />
          </svg>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Row({
  icon,
  label,
  value,
  color = "text-white",
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-zinc-500 min-w-0">
        {icon}
        <span className="text-[10px] font-medium uppercase truncate">{label}</span>
      </div>
      <div className={`font-mono font-bold text-xs shrink-0 ${danger ? "text-red-400 animate-pulse" : color}`}>
        {value}
      </div>
    </div>
  );
}
