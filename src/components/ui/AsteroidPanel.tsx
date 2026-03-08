"use client";

import { useState, useEffect, useRef } from "react";
import { Asteroid } from "@/services/nasaService";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, Target, Settings, ChevronDown, X, Search } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLaunched(false); }, [selectedAsteroid]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sort: hazardous first
  const sorted = [...asteroids]
    .sort((a, b) => Number(b.is_potentially_hazardous_asteroid) - Number(a.is_potentially_hazardous_asteroid))
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.includes(search));

  const hazCount = asteroids.filter(a => a.is_potentially_hazardous_asteroid).length;

  return (
    <>
      {/* ── Compact trigger pill — top-left ── */}
      <div ref={dropdownRef} className="fixed top-4 left-4 z-40">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-2xl border text-sm font-medium transition-all shadow-xl ${
            isOpen
              ? "bg-zinc-900/95 border-cyan-500/60 text-cyan-400"
              : "bg-zinc-900/80 border-white/10 text-white hover:border-white/30"
          }`}
        >
          <Target className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-left min-w-0">
            <div className="text-[11px] font-bold truncate max-w-[140px]">
              {selectedAsteroid ? selectedAsteroid.name : "Select Target"}
            </div>
            <div className="text-[9px] text-zinc-500 leading-none mt-0.5">
              {simRunning ? (
                <span className="text-cyan-400 animate-pulse">● Running</span>
              ) : simComplete ? (
                <span className="text-red-400 animate-pulse">● Impact</span>
              ) : selectedAsteroid ? (
                <span className="text-emerald-400">● Locked</span>
              ) : (
                `${asteroids.length} objects · ${hazCount} hazardous`
              )}
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Settings gear — inline */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="absolute top-1/2 -translate-y-1/2 -right-10 p-2 rounded-lg bg-zinc-900/80 backdrop-blur border border-white/10 text-zinc-500 hover:text-cyan-400 transition-colors"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* ── Dropdown Modal ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[calc(100%+8px)] left-0 w-80 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Detected Objects ({asteroids.length})
                </span>
                <div className="flex items-center gap-2">
                  {selectedAsteroid && (
                    <button
                      onClick={() => { onSelectAsteroid(null); setIsOpen(false); }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto px-3 pb-3 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                {isLoading ? (
                  <div className="py-6 text-center text-xs text-zinc-500 animate-pulse">Loading orbital data…</div>
                ) : sorted.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">No objects match "{search}"</div>
                ) : (
                  sorted.map((asteroid) => {
                    const isSelected = selectedAsteroid?.id === asteroid.id;
                    const isHazardous = asteroid.is_potentially_hazardous_asteroid;
                    return (
                      <div
                        key={asteroid.id}
                        onClick={() => {
                          onSelectAsteroid(asteroid);
                          setIsOpen(false);
                        }}
                        className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? "border-cyan-500/40 bg-cyan-900/20"
                            : "border-transparent hover:border-white/10 hover:bg-white/5"
                        }`}
                      >
                        {/* Hazard indicator */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isHazardous ? "bg-orange-500/15 text-orange-400" : "bg-emerald-500/15 text-emerald-400"
                        }`}>
                          {isHazardous
                            ? <AlertTriangle className="w-3.5 h-3.5 fill-current" />
                            : <ShieldCheck className="w-3.5 h-3.5" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-semibold truncate ${isSelected ? "text-cyan-400" : "text-white group-hover:text-cyan-300"}`}>
                            {asteroid.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                            Ø {asteroid.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2)} km
                            {" · "}
                            {(parseFloat(asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_hour || "0") / 3600).toFixed(1)} km/s
                          </div>
                        </div>

                        {isSelected && <div className="text-[9px] text-cyan-400 font-mono shrink-0">LOCKED</div>}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Launch button */}
              {selectedAsteroid && (
                <div className="px-3 pb-3">
                  <button
                    onClick={() => {
                      if (!launched) { setLaunched(true); onStartSimulation?.(); }
                      setIsOpen(false);
                    }}
                    disabled={launched}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      launched
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    {launched ? "Simulation Running" : "Launch Simulation"}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
