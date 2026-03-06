"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { format, addDays } from "date-fns";
import * as THREE from "three";
import { Target, Play, Pause, RotateCcw, ChevronUp } from "lucide-react";
import { fetchAsteroids, Asteroid } from "@/services/nasaService";
import { GlobeScene } from "@/components/scene/GlobeScene";
import { AsteroidPanel } from "@/components/ui/AsteroidPanel";
import { ScientificQA } from "@/components/ui/ScientificQA";
import { SimulationControls } from "@/components/ui/SimulationControls";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [asteroids, setAsteroids]             = useState<Asteroid[]>([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  const [customImpactPoint, setCustomImpactPoint] = useState<THREE.Vector3 | null>(null);
  const [isPlaying, setIsPlaying]             = useState(false);
  const [progress, setProgress]               = useState(0);
  const [confirmed, setConfirmed]             = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  // ── Animation loop ──────────────────────────────────────────────────────
  const requestRef     = useRef<number>(null);
  const previousTimeRef = useRef<number>(null);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== null) {
      const delta = time - previousTimeRef.current;
      setProgress(prev => {
        const next = prev + delta * 0.0001;
        if (next >= 1) { setIsPlaying(false); return 1; }
        return next;
      });
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      previousTimeRef.current = null;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying, animate]);

  // ── Reset simulation on asteroid change ─────────────────────────────────
  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    setConfirmed(false);
    setCustomImpactPoint(null);
  }, [selectedAsteroid]);

  // ── NASA data fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const today = new Date();
        const data  = await fetchAsteroids(
          format(today, "yyyy-MM-dd"),
          format(addDays(today, 1), "yyyy-MM-dd")
        );
        setAsteroids(Object.values(data.near_earth_objects).flat());
      } catch { setError("Failed to fetch tracking data."); }
      finally   { setIsLoading(false); }
    })();
  }, []);

  const handleReset = () => {
    setProgress(0);
    setIsPlaying(false);
    setCustomImpactPoint(null);
    setConfirmed(false);
  };

  const handleLaunch = () => { setIsPlaying(true); setConfirmed(true); };

  // ── Derived states ───────────────────────────────────────────────────────
  const simRunning  = confirmed && progress > 0 && progress < 1;
  const simComplete = progress >= 1;

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
    <main className="relative w-full h-screen bg-black overflow-hidden">

      {/* ── 3D Globe Canvas (always full-screen) ── */}
      {!isLoading && (
        <GlobeScene
          asteroids={asteroids}
          selectedAsteroid={selectedAsteroid}
          progress={progress}
          confirmed={confirmed}
          customImpactPoint={customImpactPoint}
          onPointSelect={(p) => setCustomImpactPoint(p)}
        />
      )}

      {/* ── Loading screen ── */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-blue-400 animate-pulse font-medium tracking-widest uppercase text-sm">
            Initialising Orbital Simulation…
          </p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── Impact flash ── */}
          {simComplete && (
            <div
              key={`flash-${progress}`}
              className="animate-screenFlash fixed inset-0 z-[100] bg-white pointer-events-none"
            />
          )}

          {/* ── Top title bar ── */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-950/75 backdrop-blur-md border border-zinc-800 rounded-full px-5 py-2 shadow-[0_0_20px_rgba(0,180,255,0.1)] pointer-events-none">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-zinc-300">
              Asteroid Impact Simulator
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
          <AsteroidPanel
            asteroids={asteroids}
            selectedAsteroid={selectedAsteroid}
            setSelectedAsteroid={setSelectedAsteroid}
            confirmed={confirmed}
            onLaunch={handleLaunch}
          />

          {/* ── Mobile floating bottom bar ─────────────────────────────────
               Shown on mobile only (hidden on md+).
               Phases:
                 1. Asteroid selected, not yet confirmed → Confirm Target button
                 2. Simulation running → compact play controls + scrubber
                 3. Impact complete → "View Results ↑" hint (SimulationControls handles the sheet)
          ───────────────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {selectedAsteroid && !simComplete && (
              <motion.div
                key="mobile-bar"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
              >
                {!confirmed ? (
                  /* ── Step 1: Tap globe to pick target, then confirm ── */
                  <div className="flex flex-col gap-2">
                    <p className="text-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      {customImpactPoint ? "Impact point set — ready to launch" : "Tap the globe to set impact target"}
                    </p>
                    <button
                      onClick={handleLaunch}
                      className="w-full py-3.5 font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 uppercase tracking-wider text-sm transition-all"
                    >
                      <Target className="w-4 h-4" />
                      Confirm Target & Launch
                    </button>
                  </div>
                ) : (
                  /* ── Step 2: Compact play controls ── */
                  <div className="flex items-center gap-3 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-2xl px-4 py-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={simComplete}
                      className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow"
                    >
                      {isPlaying
                        ? <Pause className="w-4 h-4 fill-current" />
                        : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
                        {selectedAsteroid.name}
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="w-8 h-8 rounded-full border border-white/20 text-white flex items-center justify-center shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: After impact, hint to scroll up the results sheet on mobile */}
            {simComplete && selectedAsteroid && (
              <motion.div
                key="result-hint"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="md:hidden fixed bottom-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest pointer-events-none"
              >
                <ChevronUp className="w-3 h-3 animate-bounce" /> Scroll for results
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Right panel (simulation controls + devastation report) ── */}
          <SimulationControls
            selectedAsteroid={selectedAsteroid}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            progress={progress}
            setProgress={setProgress}
            onReset={handleReset}
            customImpactPoint={customImpactPoint}
          />

          {/* ── AI assistant ── */}
          <ScientificQA />
        </>
      )}
    </main>
  );
}
