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


  // Only show full-screen for genuine failures; rate_limited shows inline banner
  if (error && error !== "rate_limited") {
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
          simComplete={simComplete}
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
          {/* ── Rate-limit banner (non-blocking) ── */}
          {error === "rate_limited" && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-950/90 backdrop-blur border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium pointer-events-none">
              <span className="text-amber-400">⚠</span>
              NASA API rate limit hit — loaded offline data. Set your API key in Settings.
            </div>
          )}

          {/* ── Impact flash ── */}
          {simComplete && (
            <div
              key={`flash-${progress}`}
              className="animate-screenFlash fixed inset-0 z-[100] bg-white pointer-events-none"
            />
          )}

        {/* ── Asteroid dropdown selector (floating, unmounted wrapper) ── */}
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

      {selectedAsteroid && (
         <FlightTelemetryHUD
           selectedAsteroid={selectedAsteroid}
           progress={progress}
           impactPoint={impactPoint}
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
