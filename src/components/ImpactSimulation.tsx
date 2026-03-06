"use client";

import React, { useEffect, useRef, useState } from "react";
import { Asteroid } from "@/services/nasaService";
import { Play, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface ImpactSimulationProps {
  asteroid: Asteroid | null;
}

export const ImpactSimulation = ({ asteroid }: ImpactSimulationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [impactHappened, setImpactHappened] = useState(false);
  const requestRef = useRef<number>(null);

  const asteroidPos = useRef({ x: 50, y: 50 });
  const asteroidVel = useRef({ x: 2, y: 2 });
  const earthPos = useRef({ x: 0, y: 0 });
  const earthRadius = 40;
  const asteroidRadius = useRef(5);

  const initSimulation = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    earthPos.current = { x: canvas.width / 2, y: canvas.height / 2 };
    
    // Start asteroid from a random edge
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { // Top
      asteroidPos.current = { x: Math.random() * canvas.width, y: -20 };
    } else if (side === 1) { // Right
      asteroidPos.current = { x: canvas.width + 20, y: Math.random() * canvas.height };
    } else if (side === 2) { // Bottom
      asteroidPos.current = { x: Math.random() * canvas.width, y: canvas.height + 20 };
    } else { // Left
      asteroidPos.current = { x: -20, y: Math.random() * canvas.height };
    }

    // Calculate velocity towards Earth
    const dx = earthPos.current.x - asteroidPos.current.x;
    const dy = earthPos.current.y - asteroidPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Scale velocity based on actual asteroid velocity if available
    const baseSpeed = asteroid ? Math.min(parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour) / 10000, 5) : 2;
    asteroidVel.current = { x: (dx / dist) * baseSpeed, y: (dy / dist) * baseSpeed };

    // Scale asteroid radius based on diameter
    if (asteroid) {
      const avgDiameter = (asteroid.estimated_diameter.kilometers.estimated_diameter_min + asteroid.estimated_diameter.kilometers.estimated_diameter_max) / 2;
      asteroidRadius.current = Math.max(Math.min(avgDiameter * 10, 20), 3);
    } else {
      asteroidRadius.current = 5;
    }

    setImpactHappened(false);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Earth
    const earthGradient = ctx.createRadialGradient(
      earthPos.current.x, earthPos.current.y, earthRadius * 0.5,
      earthPos.current.x, earthPos.current.y, earthRadius
    );
    earthGradient.addColorStop(0, "#3b82f6");
    earthGradient.addColorStop(1, "#1e3a8a");
    
    ctx.beginPath();
    ctx.arc(earthPos.current.x, earthPos.current.y, earthRadius, 0, Math.PI * 2);
    ctx.fillStyle = earthGradient;
    ctx.fill();
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (isSimulating && !impactHappened) {
      asteroidPos.current.x += asteroidVel.current.x;
      asteroidPos.current.y += asteroidVel.current.y;

      // Check for collision
      const dx = asteroidPos.current.x - earthPos.current.x;
      const dy = asteroidPos.current.y - earthPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < earthRadius + asteroidRadius.current) {
        setImpactHappened(true);
        setIsSimulating(false);
      }
    }

    // Draw Asteroid
    if (!impactHappened) {
      ctx.beginPath();
      ctx.arc(asteroidPos.current.x, asteroidPos.current.y, asteroidRadius.current, 0, Math.PI * 2);
      ctx.fillStyle = "#a1a1aa";
      ctx.fill();
      
      // Draw tail
      if (isSimulating) {
        ctx.beginPath();
        ctx.moveTo(asteroidPos.current.x, asteroidPos.current.y);
        ctx.lineTo(asteroidPos.current.x - asteroidVel.current.x * 10, asteroidPos.current.y - asteroidVel.current.y * 10);
        ctx.strokeStyle = "rgba(161, 161, 170, 0.3)";
        ctx.lineWidth = asteroidRadius.current;
        ctx.stroke();
      }
    } else {
      // Impact effect
      ctx.beginPath();
      ctx.arc(asteroidPos.current.x, asteroidPos.current.y, asteroidRadius.current * 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
      ctx.fill();
      
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#ef4444";
      ctx.textAlign = "center";
      ctx.fillText("IMPACT!", earthPos.current.x, earthPos.current.y + earthRadius + 30);
    }

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    initSimulation();
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [asteroid]);

  const handleToggleSim = () => {
    if (impactHappened) {
      initSimulation();
    }
    setIsSimulating(!isSimulating);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900 p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Impact Simulator</h2>
          <p className="text-sm text-zinc-400">
            {asteroid ? `Simulating ${asteroid.name}` : "Select an asteroid to simulate"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleSim}
            disabled={!asteroid}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {impactHappened ? (
              <>
                <RotateCcw size={18} /> Reset
              </>
            ) : isSimulating ? (
              "Pause"
            ) : (
              <>
                <Play size={18} /> Run Simulation
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative aspect-video w-full rounded-xl bg-black/50 border border-zinc-800">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="h-full w-full object-contain"
        />
        {!asteroid && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            Select an asteroid to begin simulation
          </div>
        )}
      </div>

      {asteroid && impactHappened && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-lg bg-red-900/20 border border-red-900/50 p-4 text-red-200"
        >
          <h3 className="font-bold">Impact Analysis</h3>
          <p className="text-sm">
            Asteroid {asteroid.name} with diameter of {(asteroid.estimated_diameter.kilometers.estimated_diameter_min + asteroid.estimated_diameter.kilometers.estimated_diameter_max / 2).toFixed(2)} km 
            would cause significant damage upon impact.
          </p>
        </motion.div>
      )}
    </div>
  );
};
