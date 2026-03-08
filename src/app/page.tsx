"use client";

import { useMemo } from "react";
import { Target } from "lucide-react";
import { calculateImpactMetrics } from "@/lib/impactCalculator";

import { AsteroidPanel } from "@/components/ui/AsteroidPanel";
import { ScientificQA } from "@/components/ui/ScientificQA";
import { SimulationControls } from "@/components/ui/SimulationControls";
import { D3GlobeMap } from "@/components/ui/D3GlobeMap";
import { MobileBottomBar } from "@/components/ui/MobileBottomBar";

import { useSimulation } from "@/hooks/useSimulation";

export default function Home() {
  const {
    asteroids,
    selectedAsteroid,
    setSelectedAsteroid,
    impactPoint,
    isPlaying,
    setIsPlaying,
    progress,
    setProgress,
    isLoading,
    error,
    mapProgress,
    setMapProgress,
    handleReset
  } = useSimulation();

  // Derived states
  const simRunning = (isPlaying || progress > 0) && progress < 1;
  const simComplete = progress >= 1;

  // Calculate metrics exactly at impact for the D3 map overlays
  const metrics = useMemo(() => {
    if (progress >= 1 && selectedAsteroid && impactPoint) {
       return calculateImpactMetrics(selectedAsteroid);
    }
    return null;
  }, [progress, selectedAsteroid, impactPoint]);


  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white p-4 text-center">
        <div>
          <h2 className="text-xl text-red-400 font-bold mb-2">Connection Error</h2>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden font-sans">
      
      {/* ── 2D/3D D3 Globe Map Canvas (always full-screen) ── */}
      {!isLoading && (
        <D3GlobeMap
          asteroids={asteroids}
          selectedAsteroid={selectedAsteroid}
          progress={progress}
          mapProgress={mapProgress}
          onMapProgressChange={setMapProgress}
          impactPoint={impactPoint}
        />
      )}

      {/* ── Loading screen ── */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="text-cyan-400 animate-pulse font-medium tracking-widest uppercase text-sm">
            Initialising Orbital Simulation…
          </p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── Impact flash (Screen Flash css animation exists in globals.css) ── */}
          {simComplete && (
            <div
              key={`flash-${progress}`}
              className="animate-screenFlash fixed inset-0 z-[100] bg-white pointer-events-none"
            />
          )}

          {/* ── Top title bar ── */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-zinc-950/75 backdrop-blur-md border border-zinc-800 rounded-full px-5 py-2 shadow-[0_0_20px_rgba(0,180,255,0.1)] pointer-events-none">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-zinc-300">
              Velocity / Asteroid Impact Simulator
            </span>
            {simRunning && (
              <span className="text-[9px] font-mono text-cyan-400 animate-pulse uppercase tracking-widest border-l border-zinc-700 pl-3">
                Simulation Running
              </span>
            )}
            {simComplete && (
              <span className="text-[9px] font-mono text-red-400 animate-pulse uppercase tracking-widest border-l border-zinc-700 pl-3">
                Impact Confirmed
              </span>
            )}
          </div>

        {/* ── Left panel (asteroid selector) ── */}
        <div className="absolute inset-x-0 bottom-0 md:relative md:inset-auto pointer-events-none z-10 w-full md:w-auto h-full flex flex-col justify-end md:justify-start">
           {/* Desktop panel mapping */}
           <div className="hidden md:block h-full border-r border-white/10 shrink-0 pointer-events-auto shadow-2xl overflow-hidden w-[350px]">
              <AsteroidPanel
                asteroids={asteroids}
                selectedAsteroid={selectedAsteroid}
                onSelectAsteroid={setSelectedAsteroid}
                isLoading={isLoading}
                onStartSimulation={() => setIsPlaying(true)}
              />
           </div>
        </div>

      {/* Overlay controls - Sidebar and Bottom Bar */}
      <SimulationControls 
        selectedAsteroid={selectedAsteroid}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        progress={progress}
        setProgress={setProgress}
        onReset={handleReset}
        impactPoint={impactPoint}
      />

      <MobileBottomBar
        asteroids={asteroids}
        selectedAsteroid={selectedAsteroid}
        onSelectAsteroid={setSelectedAsteroid}
        isLoading={isLoading}
        onStartSimulation={() => setIsPlaying(true)}
      />

          {/* ── AI assistant ── */}
          <ScientificQA />
        </>
      )}
    </main>
  );
}
