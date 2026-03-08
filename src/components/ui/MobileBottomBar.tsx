"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Target, Play, Pause, RotateCcw, ChevronUp } from "lucide-react";
import { Asteroid } from "@/services/nasaService";

interface MobileBottomBarProps {
  asteroids: Asteroid[];
  selectedAsteroid: Asteroid | null;
  onSelectAsteroid: (a: Asteroid) => void;
  isLoading: boolean;
  onStartSimulation: () => void;
}

export function MobileBottomBar({
  asteroids,
  selectedAsteroid,
  onSelectAsteroid,
  isLoading,
  onStartSimulation
}: MobileBottomBarProps) {

  // If there's an active selected asteroid, just show a launch button at the bottom
  return (
    <AnimatePresence>
      {selectedAsteroid && (
        <motion.div
          key="mobile-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none"
        >
          <div className="flex flex-col gap-2 pointer-events-auto">
            <p className="text-center text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-black/50 py-1 rounded-md">
              Target Acquired: {selectedAsteroid.name}
            </p>
            <button
              onClick={onStartSimulation}
              className="w-full py-3.5 font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 uppercase tracking-wider text-sm transition-all"
            >
              <Target className="w-4 h-4" />
              Launch Simulation
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
