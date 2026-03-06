"use client";

import { Asteroid } from "@/services/nasaService";
import { cn } from "@/lib/utils";
import { Info, ShieldAlert, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface AsteroidCardProps {
  asteroid: Asteroid;
  onSelect: (asteroid: Asteroid) => void;
  isSelected?: boolean;
}

export const AsteroidCard = ({ asteroid, onSelect, isSelected }: AsteroidCardProps) => {
  const isHazardous = asteroid.is_potentially_hazardous_asteroid;
  const diameterMin = asteroid.estimated_diameter.kilometers.estimated_diameter_min.toFixed(2);
  const diameterMax = asteroid.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2);
  const velocity = parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(2);
  const distance = parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers).toLocaleString();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600",
        isSelected && "border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-900/10"
      )}
      onClick={() => onSelect(asteroid)}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{asteroid.name}</h3>
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {isHazardous ? (
              <span className="flex items-center gap-1 text-red-500">
                <ShieldAlert size={14} /> Potentially Hazardous
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-500">
                <ShieldCheck size={14} /> Safe
              </span>
            )}
          </div>
        </div>
        <Info size={16} className="text-zinc-400" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-zinc-500">Est. Diameter</p>
          <p className="font-medium">{diameterMin} - {diameterMax} km</p>
        </div>
        <div>
          <p className="text-zinc-500">Velocity</p>
          <p className="font-medium text-blue-600 dark:text-blue-400">{velocity} km/h</p>
        </div>
        <div>
          <p className="text-zinc-500">Miss Distance</p>
          <p className="font-medium">{distance} km</p>
        </div>
        <div>
          <p className="text-zinc-500">Sentry Object</p>
          <p className="font-medium">{asteroid.is_sentry_object ? "Yes" : "No"}</p>
        </div>
      </div>
    </motion.div>
  );
};
