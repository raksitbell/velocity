import { useState, useRef, useCallback, useEffect } from "react";
import { format, addDays } from "date-fns";
import { fetchAsteroids, Asteroid } from "@/services/nasaService";
import { calculateImpactMetrics } from "@/lib/impactCalculator";
import { useSettings } from "@/hooks/useSettings";

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
  const [mapMode, setMapMode] = useState<"3d" | "2d">("3d");
  const [mapProgress, setMapProgress] = useState(0); 

  // Map Rotation Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime: number | null = null;
    
    const animateMap = (time: number) => {
      if (lastTime !== null) {
        const delta = time - lastTime;
        setMapProgress(prev => {
           const target = mapMode === "2d" ? 100 : 0;
           if (prev === target) return prev;
           
           const step = delta * 0.2; // Speed of unroll
           if (mapMode === "2d") return Math.min(100, prev + step);
           else return Math.max(0, prev - step);
        });
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(animateMap);
    };
    
    animationFrameId = requestAnimationFrame(animateMap);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mapMode]);

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
          // Auto-unroll map at impact
          setMapMode("2d"); 
          return 1; 
        }
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
    return () => { 
      if (requestRef.current) cancelAnimationFrame(requestRef.current); 
    };
  }, [isPlaying, animate]);

  // Reset simulation when asteroid changes and derive deterministic target
  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    setMapMode("3d"); // Roll back to globe
    
    if (selectedAsteroid) {
       // Auto-calculate impact point
       const metrics = calculateImpactMetrics(selectedAsteroid);
       setImpactPoint({ lat: metrics.lat, lon: metrics.lon });
    } else {
       setImpactPoint(null);
    }
  }, [selectedAsteroid]);

  // ─── Settings bindings
  const { dataSource, apiKey, setLastSynced } = useSettings();

  // Fetch initial NASA Data
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const today = new Date();
        const data  = await fetchAsteroids(
          format(today, "yyyy-MM-dd"),
          format(addDays(today, 1), "yyyy-MM-dd"),
          dataSource,
          apiKey
        );
        
        // Merge objects flattened if offline database has multiple dates mapped
        const flattenObjects = Object.values(data.near_earth_objects).flat() as Asteroid[];
        setAsteroids(flattenObjects);
        setLastSynced(Date.now());
      } catch (e: any) {
        console.error("Simulation error starting NASA API fetch:", e);
        if (e.name === "NasaRateLimitError") {
           setError("NASA API Rate Limit Exceeded (HTTP 429). Please switch to 'Offline DB' or configure your own API Key in Settings.");
        } else {
           setError("Failed to fetch tracking data."); 
        }
      } finally { 
        setIsLoading(false); 
      }
    })();
  }, [dataSource, apiKey]);

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
    mapMode,
    setMapMode,
    handleReset
  };
}
