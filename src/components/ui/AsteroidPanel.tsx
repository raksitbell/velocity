"use client";

import { useState, useEffect } from "react";
import { Asteroid } from "@/services/nasaService";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, Menu, X, Target, ChevronRight } from "lucide-react";

interface AsteroidPanelProps {
  asteroids: Asteroid[];
  selectedAsteroid: Asteroid | null;
  setSelectedAsteroid: (val: Asteroid | null) => void;
  confirmed: boolean;
  onLaunch?: () => void;
}

export function AsteroidPanel({
  asteroids,
  selectedAsteroid,
  setSelectedAsteroid,
  confirmed,
  onLaunch,
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
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent flex items-center gap-2">
                  <Target className="w-6 h-6 text-cyan-400" />
                  Velocity
                </h1>
                <p className="text-zinc-400 text-sm mt-1">Asteroid Impact Simulator</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Asteroid list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                <span>Detected Objects ({sorted.length})</span>
                {selectedAsteroid && (
                  <button
                    onClick={() => setSelectedAsteroid(null)}
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
                      setSelectedAsteroid(asteroid);
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
                          Targeting <ChevronRight className="w-3 h-3" />
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

            {/* Confirm Target — desktop only; mobile has its own floating bar */}
            {selectedAsteroid && !confirmed && (
              <div className="hidden md:block p-6 border-t border-white/10 bg-black/60">
                <button
                  onClick={() => {
                    if (!launched) {
                      setLaunched(true);
                      onLaunch?.();
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
                  {launched ? "Target Locked — Simulation Running" : "Confirm Target"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
