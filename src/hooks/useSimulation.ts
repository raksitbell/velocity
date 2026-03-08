import { useState, useRef, useCallback, useEffect } from "react";
import { format, addDays } from "date-fns";
import { fetchAsteroids, Asteroid } from "@/services/nasaService";
import { calculateImpactMetrics } from "@/lib/impactCalculator";

export function useSimulation() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  
  // Deterministic impact point based on the parsed selectedAsteroid
  const [impactPoint, setImpactPoint] = useState<{ lat: number, lon: number } | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toggle between 3D Globe and 2D Map (used by new D3 globe)
  const [mapProgress, setMapProgress] = useState(0); 

  // Simulation Animation Loop
  const requestRef = useRef<number>(null);
  const previousTimeRef = useRef<number>(null);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== null) {
      const delta = time - previousTimeRef.current;
      setProgress(prev => {
        // Reduced speed slightly since SVG projection calculation takes more CPU
        const next = prev + delta * 0.00008; 
        if (next >= 1) { 
          setIsPlaying(false); 
          return 1; 
        }
        return next;
      });

      // Also unroll the map to 2D automatically upon impact
      setMapProgress(prev => {
         const t = prev + delta * 0.05;
         return t >= 100 ? 100 : t;
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
    return () => { 
      if (requestRef.current) cancelAnimationFrame(requestRef.current); 
    };
  }, [isPlaying, animate]);

  // Reset simulation when asteroid changes and derive deterministic target
  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    setMapProgress(0); // Roll back to globe
    
    if (selectedAsteroid) {
       // Auto-calculate impact point
       const metrics = calculateImpactMetrics(selectedAsteroid);
       setImpactPoint({ lat: metrics.lat, lon: metrics.lon });
    } else {
       setImpactPoint(null);
    }
  }, [selectedAsteroid]);

  // Fetch initial NASA Data
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const today = new Date();
        const data  = await fetchAsteroids(
          format(today, "yyyy-MM-dd"),
          format(addDays(today, 1), "yyyy-MM-dd")
        );
        setAsteroids(Object.values(data.near_earth_objects).flat() as Asteroid[]);
      } catch { 
        setError("Failed to fetch tracking data."); 
      } finally { 
        setIsLoading(false); 
      }
    })();
  }, []);

  const handleReset = () => {
    setProgress(0);
    setMapProgress(0);
    setIsPlaying(false);
  };

  return {
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
  };
}
