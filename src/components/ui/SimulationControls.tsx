"use client";

import { useState, useEffect, useRef } from "react";
import { Asteroid } from "@/services/nasaService";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Crosshair, MapPin, Flame, Skull, Waves, ArrowRight, Target } from "lucide-react";
import { format } from "date-fns";
import * as THREE from "three";
import { calculateImpactMetrics, ImpactMetrics } from "@/lib/impactCalculator";
import dynamic from "next/dynamic";

const IsometricImpactMap = dynamic(
  () => import("./IsometricImpactMap").then(mod => mod.IsometricImpactMap), 
  { ssr: false, loading: () => <div className="w-full h-56 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center text-xs text-zinc-500 font-mono tracking-widest uppercase">Loading Radar...</div> }
);

interface SimulationControlsProps {
  selectedAsteroid: Asteroid | null;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  progress: number; // 0 to 1
  setProgress: (val: number) => void;
  onReset: () => void;
  impactPoint?: { lat: number, lon: number } | null;
}

export function SimulationControls({
  selectedAsteroid,
  isPlaying,
  setIsPlaying,
  progress,
  setProgress,
  onReset,
  impactPoint
}: SimulationControlsProps) {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);
  const [locationName, setLocationName] = useState<string>("Calculating...");
  
  // Mobile bottom sheet expansion
  const [isExpanded, setIsExpanded] = useState(false);
  const touchStartY = useRef(0);


  // Derive simulation dates based on progress
  useEffect(() => {
    if (!selectedAsteroid) return;

    // Only calc metrics exactly at impact to save performance
    if (progress >= 1 && !metrics && impactPoint) {
      
      const m = calculateImpactMetrics(selectedAsteroid);
      setMetrics(m);

      // Fetch real-world location data via open-source API
      setLocationName("Calculating...");
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${m.lat}&longitude=${m.lon}&localityLanguage=en`)
        .then(res => res.json())
        .then(data => {
            const loc = data.city || data.locality || data.principalSubdivision || data.countryName;
            if (loc) {
               setLocationName(`${loc}, ${data.countryCode || ''}`);
            } else {
               setLocationName(m.isWater ? "Open Ocean" : "Remote Landmass");
            }
        })
        .catch(() => setLocationName("Unknown Zone"));


    } else if (progress < 1 && metrics) {
      setMetrics(null);
      setLocationName("");
    }
  }, [progress, selectedAsteroid, metrics]);

  if (!selectedAsteroid) return null;

  const approachDateStr = selectedAsteroid.close_approach_data?.[0]?.close_approach_date;
  const approachDate = approachDateStr ? new Date(approachDateStr) : new Date();
  if (isNaN(approachDate.getTime())) approachDate.setTime(Date.now());
  
  const startDate = new Date(approachDate);
  startDate.setDate(startDate.getDate() - 30);
  const currentDate = new Date(startDate.getTime() + (approachDate.getTime() - startDate.getTime()) * progress);

  // Mobile: bottom sheet after impact
  // transition-[max-height] ensures smooth expansion
  const mobileClass = progress >= 1
    ? `fixed bottom-0 left-0 right-0 w-full rounded-t-2xl flex flex-col z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? 'max-h-[85vh]' : 'max-h-[50vh]'} md:max-h-none md:rounded-none md:top-0 md:left-0 md:bottom-auto md:right-auto md:h-full md:w-[420px]`
    : "hidden md:flex md:fixed md:top-0 md:left-0 md:h-full md:w-[420px]";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className={`${mobileClass} bg-zinc-950/85 backdrop-blur-2xl border-r border-white/10 z-30 flex flex-col shadow-2xl overflow-hidden`}
      >
        {/* Drag handle on mobile / spacer on desktop */}
        <div 
          className="md:hidden flex flex-col items-center justify-center py-4 shrink-0 cursor-grab active:cursor-grabbing"
          onClick={() => setIsExpanded(!isExpanded)}
          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => {
            const dy = e.changedTouches[0].clientY - touchStartY.current;
            if (dy < -30) setIsExpanded(true);  // Swiped up -> expand
            if (dy > 30) setIsExpanded(false);  // Swiped down -> collapse
          }}
        >
          <div className="w-12 h-1.5 rounded-full bg-white/20 mb-1" />
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
            {isExpanded ? 'Swipe down to close' : 'Swipe up to expand'}
          </div>
        </div>
        <div className="hidden md:block h-[68px] shrink-0" />

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 shrink-0 bg-black/20">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${progress >= 1 ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            <Crosshair className={`w-4 h-4 ${progress < 1 ? 'animate-pulse' : ''}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{selectedAsteroid.name}</h3>
            <p className={`text-[10px] font-medium truncate ${progress >= 1 ? 'text-red-400' : 'text-zinc-500'}`}>
              {progress >= 1 ? 'Impact Confirmed · Devastation Report' : 'Target Locked · Simulating Trajectory'}
            </p>
          </div>
        </div>

        {/* Overview Interface - all metrics stacked */}
        {progress >= 1 && metrics ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 pb-4">
              <div className="flex flex-col gap-6">

                {/* 1. Overview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Geographic Overview</span>
                  </div>
                  {/* 2D Map */}
                  <div className="w-full relative">
                    <div className="absolute top-2 left-2 z-50 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-cyan-500/30 text-xs font-mono text-cyan-400 font-bold tracking-widest uppercase pointer-events-none">
                      Tactical Impact Map
                    </div>
                    <IsometricImpactMap lat={metrics.lat} lon={metrics.lon} isWater={metrics.isWater} />
                  </div>

                  {/* Ground Zero */}
                  <div className="bg-red-950/30 p-4 rounded-xl border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Ground Zero</span>
                    </div>
                    <div className="text-lg text-white font-bold truncate" title={locationName}>{locationName}</div>
                    <div className="text-sm text-zinc-400 font-mono mt-1">
                      {Math.abs(metrics.lat).toFixed(4)}°{metrics.lat >= 0 ? 'N' : 'S'},{' '}
                      {Math.abs(metrics.lon).toFixed(4)}°{metrics.lon >= 0 ? 'E' : 'W'}
                    </div>
                  </div>

                  {/* Key stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-950/30 p-3 rounded-xl border border-orange-500/20">
                      <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Energy (TNT)</div>
                      <div className="text-white font-mono font-bold text-lg">
                        {metrics.kineticEnergyMegatons > 1000
                          ? (metrics.kineticEnergyMegatons / 1000).toFixed(2) + ' GT'
                          : metrics.kineticEnergyMegatons.toFixed(1) + ' MT'}
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-700">
                      <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Diameter</div>
                      <div className="text-white font-mono font-bold text-lg">
                        {metrics.originalDiameterKm >= 1
                          ? metrics.originalDiameterKm.toFixed(2) + ' km'
                          : (metrics.originalDiameterKm * 1000).toFixed(0) + ' m'}
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-700">
                      <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Velocity</div>
                      <div className="text-white font-mono font-bold text-lg">
                        {(parseFloat(selectedAsteroid.close_approach_data[0]?.relative_velocity.kilometers_per_hour || '0') / 3600).toFixed(1)} km/s
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-700">
                      <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Recurrence</div>
                      <div className="text-white font-mono font-bold text-lg">
                        {metrics.recurrencePeriodYears > 1e6
                          ? (metrics.recurrencePeriodYears / 1e6).toFixed(1) + ' Myr'
                          : metrics.recurrencePeriodYears > 1000
                          ? (metrics.recurrencePeriodYears / 1000).toFixed(1) + ' kyr'
                          : metrics.recurrencePeriodYears + ' yr'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Thermal */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">Thermal Effects</span>
                  </div>
                  <div className="bg-purple-950/30 p-4 rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <Flame className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Atmospheric Ablation</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <div className="text-zinc-500 text-xs">Exo-Atmosphere</div>
                        <div className="text-purple-300 font-mono mt-1">{(metrics.originalDiameterKm * 1000).toFixed(0)}m</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs">Ground Impact</div>
                        <div className="text-red-400 font-mono mt-1">{(metrics.finalDiameterKm * 1000).toFixed(0)}m</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-purple-800/50 flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Mass Destroyed</span>
                      <span className="text-white font-mono">{metrics.burnPercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="bg-red-950/30 p-4 rounded-xl border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <Flame className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Thermal Pulse / Fireball</span>
                    </div>
                    <div className="text-2xl text-white font-mono mt-2 text-red-400">
                      {metrics.fireballRadiusKm.toFixed(1)} km
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Radius of 3rd degree burns and spontaneous combustion.</p>
                  </div>
                </div>

                {/* 3. Wave Blast */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Shockwave Blast</span>
                  </div>
                  {metrics.isWater ? (
                    <div className="bg-blue-950/30 p-4 rounded-xl border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <Waves className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Tsunami Wave Height</span>
                      </div>
                      <div className="text-2xl text-white font-mono mt-2 text-blue-400">
                        {metrics.tsunamiHeightMeters.toFixed(0)} meters
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">Maximum displaced water wave height upon deep impact.</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-950/30 p-4 rounded-xl border border-yellow-500/20">
                      <div className="flex items-center gap-2 text-yellow-400 mb-2">
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Evacuation / Shockwave</span>
                      </div>
                      <div className="text-2xl text-white font-mono mt-2 text-yellow-500">
                        {metrics.evacuationRadiusKm >= 1 ? metrics.evacuationRadiusKm.toFixed(1) : '< 1'} km
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">Radius of structural collapse and deadly overpressure.</p>
                    </div>
                  )}
                </div>

                {/* 4. Casualties */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Fatalities</span>
                  </div>
                  <div className="bg-red-950/40 p-6 rounded-xl border border-red-500/30 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                      <Skull className="w-8 h-8 text-red-500" />
                    </div>
                    <h4 className="text-red-400 font-bold uppercase tracking-widest text-sm mb-2">Estimated Casualties</h4>
                    <div className="text-4xl text-white font-mono font-bold tracking-tight">
                      {metrics.estimatedCasualties > 1000000000
                        ? (metrics.estimatedCasualties / 1000000000).toFixed(2) + ' B'
                        : metrics.estimatedCasualties > 1000000
                        ? (metrics.estimatedCasualties / 1000000).toFixed(2) + ' M'
                        : metrics.estimatedCasualties.toLocaleString()}
                    </div>
                    <p className="text-xs text-zinc-400 mt-4 leading-relaxed max-w-xs">
                      {metrics.isWater
                        ? 'Calculated based on coastal proximity and tsunami attenuation models.'
                        : 'Based on population density within the 5 psi overpressure shockwave radius.'}
                    </p>
                  </div>
                </div>

                {/* 5. Crater */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Crater Topology</span>
                  </div>
                  <div className="bg-amber-950/30 p-4 rounded-xl border border-amber-600/30">
                    <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">Crater Dimensions</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-zinc-500 text-xs">Diameter</div>
                        <div className="text-white font-mono text-xl mt-1">{metrics.craterDiameterKm.toFixed(2)} km</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs">Depth (est.)</div>
                        <div className="text-white font-mono text-xl mt-1">{(metrics.craterDiameterKm * 0.1).toFixed(2)} km</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs">Rim Radius</div>
                        <div className="text-white font-mono text-xl mt-1">{(metrics.craterDiameterKm * 0.6).toFixed(2)} km</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs">Ejecta Blanket</div>
                        <div className="text-white font-mono text-xl mt-1">{(metrics.craterDiameterKm * 2.5).toFixed(1)} km</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 text-xs text-zinc-400 leading-relaxed">
                    Impact crater scaled using the <span className="text-white">Pi-group scaling law</span>. Depth estimates assume rocky terrain at 45° angle of impact.
                  </div>
                </div>

                {/* 6. Seismic */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Seismology</span>
                  </div>
                  <div className="bg-green-950/30 p-4 rounded-xl border border-green-600/30">
                    <div className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">Seismic Activity</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-zinc-500 text-xs">Richter Magnitude</div>
                        <div className="text-white font-mono text-3xl mt-1">M {metrics.richterMagnitude.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs">Seismic Radius</div>
                        <div className="text-white font-mono text-xl mt-1">
                          {metrics.seismicRadiusKm > 1000
                            ? (metrics.seismicRadiusKm / 1000).toFixed(1) + ' Mm'
                            : metrics.seismicRadiusKm.toFixed(0) + ' km'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-green-900/50">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Intensity Class</span>
                        <span className="text-white font-mono">
                          {metrics.richterMagnitude >= 9 ? 'Extreme / Extinction Level'
                            : metrics.richterMagnitude >= 8 ? 'Great Earthquake'
                            : metrics.richterMagnitude >= 7 ? 'Major Earthquake'
                            : metrics.richterMagnitude >= 6 ? 'Strong Earthquake'
                            : 'Moderate'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 text-xs text-zinc-400 leading-relaxed">
                    Seismic magnitude derived from impact kinetic energy using the <span className="text-white">Collins-Melosh energy-magnitude scaling relation</span>.
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          // When no impact yet — center-fill to push footer to bottom
          <div className="flex-1" />
        )}

        {/* ── Compact Timeline Footer – always pinned to bottom ── */}
        <div className="shrink-0 border-t border-white/10 bg-black/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={progress >= 1}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                progress >= 1
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={onReset}
              className="w-7 h-7 rounded-full border border-white/20 text-zinc-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors shrink-0"
              title="Reset"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <div className="relative flex-1">
              <input
                type="range" min="0" max="1" step="0.001" value={progress}
                onChange={(e) => { setIsPlaying(false); setProgress(parseFloat(e.target.value)); }}
                className={`w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full ${
                  progress >= 1 ? '[&::-webkit-slider-thumb]:bg-red-500' : '[&::-webkit-slider-thumb]:bg-cyan-500'
                }`}
              />
              <div
                className={`absolute top-1/2 -translate-y-1/2 left-0 h-1 rounded-l-lg pointer-events-none ${
                  progress >= 1 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className={`font-mono text-[10px] font-bold shrink-0 tabular-nums ${
              progress >= 1 ? 'text-red-400' : 'text-zinc-400'
            }`}>
              {format(currentDate, "MMM dd'yy")}
            </div>
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
