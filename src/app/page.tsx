"use client";

import { useMemo, useState, useCallback } from "react";
import { Settings } from "lucide-react";
import { calculateImpactMetrics } from "@/lib/impactCalculator";

import { AsteroidPanel } from "@/components/ui/AsteroidPanel";
import { ScientificQA } from "@/components/ui/ScientificQA";
import { FlightTelemetryHUD } from "@/components/ui/FlightTelemetryHUD";
import { SimulationControls } from "@/components/ui/SimulationControls";
import { D3GlobeMap } from "@/components/ui/D3GlobeMap";
import { MobileBottomBar } from "@/components/ui/MobileBottomBar";
import { SettingsDialog } from "@/components/ui/SettingsDialog";

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
    mapMode,
    setMapMode,
    handleReset
  } = useSimulation();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [astScreenPos, setAstScreenPos] = useState<{ x: number; y: number } | null>(null);
  const onAsteroidScreenPos = useCallback((x: number, y: number) => setAstScreenPos({ x, y }), []);

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
          mapMode={mapMode}
          onMapModeChange={setMapMode}
          impactPoint={impactPoint}
          onAsteroidScreenPos={onAsteroidScreenPos}
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
                onOpenSettings={() => setIsSettingsOpen(true)}
                simRunning={simRunning}
                simComplete={simComplete}
              />
           </div>
        </div>

      {selectedAsteroid && (
         <FlightTelemetryHUD
           selectedAsteroid={selectedAsteroid}
           progress={progress}
           asteroidScreenPos={astScreenPos}
         />
      )}

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
          
          <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
      )}
    </main>
  );
}
