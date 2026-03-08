"use client";

import { Asteroid } from "@/services/nasaService";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Thermometer, Orbit, Mountain, AlertCircle } from "lucide-react";

interface FlightTelemetryHUDProps {
  selectedAsteroid: Asteroid;
  progress: number;
}

export function FlightTelemetryHUD({ selectedAsteroid, progress }: FlightTelemetryHUDProps) {
  // Only render during actual flight
  if (progress <= 0 || progress >= 1) return null;

  // 1. Initial State Definitions
  const startingVelocityKps = parseFloat(selectedAsteroid.close_approach_data[0]?.relative_velocity.kilometers_per_second || "15.0");
  const estDiamMin = selectedAsteroid.estimated_diameter.meters.estimated_diameter_min;
  const estDiamMax = selectedAsteroid.estimated_diameter.meters.estimated_diameter_max;
  const avgDiamMeters = (estDiamMin + estDiamMax) / 2;
  
  // Assume a spherical chondrite asteroid density of ~3000 kg/m^3
  const volume = (4 / 3) * Math.PI * Math.pow(avgDiamMeters / 2, 3);
  const massKg = volume * 3000;

  // Anchor distance points
  // Let simulation start at 384,400km (Lunar distance)
  const MAX_ALTITUDE = 384400; 
  const currentAltitude = MAX_ALTITUDE * (1 - progress);

  // Velocity increases naturally slightly as it gets closer due to Earth gravity well
  const currentVelocity = startingVelocityKps + (progress * 5.2); 

  // Heat starts generating upon atmospheric entry (100km Karman Line)
  let shellTemp = -270; // deep space roughly 3 Kelvin (-270C)
  if (currentAltitude <= 100) {
     // Exosphere/Thermosphere boundary heats up rapidly
     const penetrationScale = 1 - (currentAltitude / 100);
     shellTemp = -270 + (penetrationScale * 2500); // 2500C max ablation temp
  }

  const isEnteringAtmosphere = currentAltitude <= 100;

  const displayMass = massKg > 1e9 ? (massKg / 1e9).toFixed(1) + " Mt" : (massKg / 1e6).toFixed(1) + " Kt";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        className="fixed top-24 left-6 z-40 flex flex-col gap-3 pointer-events-none"
      >
        {/* Karman Line Warning */}
        <AnimatePresence>
          {isEnteringAtmosphere && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/20 text-red-400 border border-red-500/50 backdrop-blur-md px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-red-300">Hazard Warning</div>
                <div className="font-mono text-sm leading-tight">ATMOSPHERIC ENTRY DETECTED</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Telemetry Block */}
        <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 w-64 rounded-xl p-4 shadow-2xl">
           <div className="text-cyan-400 text-[10px] font-bold tracking-[0.2em] mb-4 border-b border-cyan-500/20 pb-2 uppercase flex items-center justify-between">
              Live Telemetry
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
           </div>

           <div className="space-y-4">
              {/* Altitude */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Mountain className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase min-w-16">Altitude</span>
                </div>
                <div className={`font-mono font-bold ${currentAltitude < 100 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {currentAltitude >= 1000 
                    ? currentAltitude.toLocaleString(undefined, { maximumFractionDigits: 0 }) 
                    : currentAltitude.toFixed(1)} km
                </div>
              </div>

              {/* Velocity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase min-w-16">Velocity</span>
                </div>
                <div className="font-mono font-bold text-cyan-300">
                  {currentVelocity.toFixed(2)} km/s
                </div>
              </div>

              {/* Mass */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Orbit className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase min-w-16">Est. Mass</span>
                </div>
                <div className="font-mono font-bold text-white">
                  {displayMass}
                </div>
              </div>

              {/* Shell Temperature */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase min-w-16">Hull Temp</span>
                </div>
                <div className={`font-mono font-bold ${shellTemp > 0 ? 'text-orange-400' : 'text-blue-300'}`}>
                  {shellTemp.toFixed(0)}°C
                </div>
              </div>
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
