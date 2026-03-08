"use client";

import { useState, useEffect } from "react";
import { Asteroid } from "@/services/nasaService";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, Menu, X, Target, Settings } from "lucide-react";

interface AsteroidPanelProps {
  asteroids: Asteroid[];
  selectedAsteroid: Asteroid | null;
  onSelectAsteroid: (val: Asteroid | null) => void;
  isLoading: boolean;
  onStartSimulation?: () => void;
  onOpenSettings?: () => void;
  simRunning?: boolean;
  simComplete?: boolean;
}

export function AsteroidPanel({
  asteroids,
  selectedAsteroid,
  onSelectAsteroid,
  isLoading,
  onStartSimulation,
  onOpenSettings,
  simRunning,
  simComplete,
}: AsteroidPanelProps) {
  // Start closed on mobile so the globe is visible by default.
  // Open automatically on desktop (≥ 768 px) after hydration.
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const open = window.innerWidth >= 768;
    setIsOpen(open);
  }, []);
  const [launched, setLaunched] = useState(false);

  // Reset launch lock when a different asteroid is selected
  useEffect(() => {
    setLaunched(false);
  }, [selectedAsteroid]);

  // Sort: hazardous first
  const sorted = [...asteroids].sort(
    (a, b) =>
      Number(b.is_potentially_hazardous_asteroid) -
      Number(a.is_potentially_hazardous_asteroid)
  );

  return (
    <>
      {/* Mobile toggle button — always visible when panel is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-xl"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="fixed top-0 left-0 h-full w-[85vw] sm:w-80 md:w-96 bg-black/40 backdrop-blur-2xl border-r border-white/10 z-30 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent leading-none">
                    Velocity
                  </h1>
                  {simRunning && (
                    <span className="text-[9px] font-mono text-cyan-400 animate-pulse uppercase tracking-widest">
                      Simulation Running
                    </span>
                  )}
                  {simComplete && !simRunning && (
                    <span className="text-[9px] font-mono text-red-400 animate-pulse uppercase tracking-widest">
                      Impact Confirmed
                    </span>
                  )}
                  {!simRunning && !simComplete && (
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Asteroid Impact Simulator</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Asteroid list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                <span>Detected Objects ({sorted.length})</span>
                {selectedAsteroid && (
                  <button
                    onClick={() => onSelectAsteroid(null)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {sorted.map((asteroid) => {
                const isSelected = selectedAsteroid?.id === asteroid.id;
                const isHazardous = asteroid.is_potentially_hazardous_asteroid;

                return (
                  <div
                    key={asteroid.id}
                    onClick={() => {
                      onSelectAsteroid(asteroid);
                      // Auto-dismiss sidebar on mobile so the globe is immediately visible
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setIsOpen(false);
                      }
                    }}
                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                      isSelected
                        ? "border-cyan-500/50 bg-cyan-900/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : "border-white/5 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-start mb-2">
                      <h3
                        className={`font-semibold transition-colors flex items-center gap-2 ${
                          isSelected
                            ? "text-cyan-400"
                            : "text-white group-hover:text-cyan-300"
                        }`}
                      >
                        {asteroid.name}
                        {isHazardous ? (
                          <AlertTriangle className="w-4 h-4 text-orange-400 fill-orange-400/20" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        )}
                      </h3>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-cyan-400 text-xs font-medium animate-pulse">
                          Target Locked →
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-4 text-sm">
                      <div>
                        <div className="text-zinc-500 text-xs">Diameter (max)</div>
                        <div className="text-zinc-200">
                          {asteroid.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2)} km
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs">Velocity</div>
                        <div className="text-zinc-200">
                          {parseFloat(
                            asteroid.close_approach_data[0]?.relative_velocity
                              .kilometers_per_hour || "0"
                          ).toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                          km/h
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs">Miss Distance</div>
                        <div className="text-zinc-200">
                          {parseFloat(
                            asteroid.close_approach_data[0]?.miss_distance.kilometers || "0"
                          ).toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                          km
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs">Approach Date</div>
                        <div className="text-zinc-200">
                          {asteroid.close_approach_data[0]?.close_approach_date}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Launch Simulation — desktop only; mobile has its own floating bar */}
            {selectedAsteroid && (
              <div className="hidden md:block p-6 border-t border-white/10 bg-black/60">
                <button
                  onClick={() => {
                    if (!launched) {
                      setLaunched(true);
                      onStartSimulation?.();
                    }
                  }}
                  disabled={launched}
                  className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm ${
                    launched
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                      : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  }`}
                >
                  <Target className="w-4 h-4" />
                  {launched ? "Simulation Running" : "Launch Simulation"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
