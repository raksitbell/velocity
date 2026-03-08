import { useState, useRef, useCallback, useEffect } from "react";
import { format, addDays } from "date-fns";
import { fetchAsteroids, Asteroid } from "@/services/nasaService";
import { calculateImpactMetrics } from "@/lib/impactCalculator";
import { useSettings } from "@/hooks/useSettings";

export function useSimulation() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  const [impactPoint, setImpactPoint] = useState<{ lat: number; lon: number } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toggle between 3D Globe and 2D Map
  const [mapMode, setMapMode] = useState<"3d" | "2d">("3d");
  const [mapProgress, setMapProgress] = useState(0);

  // ── Refs for synchronous tracking (avoid setState-inside-setState) ──
  const progressRef = useRef(0);
  const mapProgressRef = useRef(0);
  const mapModeRef = useRef<"3d" | "2d">("3d");
  const isPlayingRef = useRef(false);

  // Keep mapModeRef in sync
  useEffect(() => {
    mapModeRef.current = mapMode;
  }, [mapMode]);

  // ── Map Roll/Unroll Animation (separate rAF, stops when done) ──
  const mapAnimRef = useRef<number | null>(null);
  const mapLastTimeRef = useRef<number | null>(null);

  const stopMapAnim = useCallback(() => {
    if (mapAnimRef.current !== null) {
      cancelAnimationFrame(mapAnimRef.current);
      mapAnimRef.current = null;
    }
    mapLastTimeRef.current = null;
  }, []);

  const startMapAnim = useCallback(() => {
    stopMapAnim();

    const animateMap = (time: number) => {
      if (mapLastTimeRef.current !== null) {
        const delta = time - mapLastTimeRef.current;
        const target = mapModeRef.current === "2d" ? 100 : 0;
        const current = mapProgressRef.current;

        if (Math.abs(current - target) < 0.3) {
          // Reached target — snap & stop loop
          mapProgressRef.current = target;
          setMapProgress(target);
          mapAnimRef.current = null;
          return;
        }

        const step = delta * 0.22;
        const next =
          target === 100
            ? Math.min(100, current + step)
            : Math.max(0, current - step);

        mapProgressRef.current = next;
        setMapProgress(next);
      }

      mapLastTimeRef.current = time;
      mapAnimRef.current = requestAnimationFrame(animateMap);
    };

    mapAnimRef.current = requestAnimationFrame(animateMap);
  }, [stopMapAnim]);

  // Restart map animation whenever mapMode changes
  useEffect(() => {
    startMapAnim();
    return stopMapAnim;
  }, [mapMode, startMapAnim, stopMapAnim]);

  // ── Flight Animation Loop ──
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== null) {
      const delta = time - previousTimeRef.current;
      const next = progressRef.current + delta * 0.00008;

      if (next >= 1) {
        // Impact — update all state OUTSIDE updater functions
        progressRef.current = 1;
        setProgress(1);
        isPlayingRef.current = false;
        setIsPlaying(false);
        // Keep current map view — do not auto-switch to 2D
        // Stop flight loop
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
        previousTimeRef.current = null;
        return;
      }

      progressRef.current = next;
      setProgress(next);
    }

    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      isPlayingRef.current = true;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      previousTimeRef.current = null;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  // Reset when asteroid selection changes
  useEffect(() => {
    progressRef.current = 0;
    mapProgressRef.current = 0;
    setProgress(0);
    setIsPlaying(false);
    setMapMode("3d");

    if (selectedAsteroid) {
      const metrics = calculateImpactMetrics(selectedAsteroid);
      setImpactPoint({ lat: metrics.lat, lon: metrics.lon });
    } else {
      setImpactPoint(null);
    }
  }, [selectedAsteroid]);

  // ── Settings bindings ──
  const { dataSource, apiKey, setLastSynced, setDataSource } = useSettings();

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const today = new Date();
        const data = await fetchAsteroids(
          format(today, "yyyy-MM-dd"),
          format(addDays(today, 1), "yyyy-MM-dd"),
          dataSource,
          apiKey
        );
        const flattenObjects = Object.values(data.near_earth_objects).flat() as Asteroid[];
        setAsteroids(flattenObjects);
        setLastSynced(Date.now());
      } catch (e: any) {
        console.error("Simulation error starting NASA API fetch:", e);
        if (e.name === "NasaRateLimitError") {
          // Rate-limited — silently fall back to offline DB, keep the app running
          try {
            const fallbackData = await fetchAsteroids(
              format(new Date(), "yyyy-MM-dd"),
              format(addDays(new Date(), 1), "yyyy-MM-dd"),
              "offline",
              apiKey
            );
            const flat = Object.values(fallbackData.near_earth_objects).flat() as Asteroid[];
            setAsteroids(flat);
            // Switch setting to offline so future loads don't re-hit the limit
            setDataSource("offline");
            setError("rate_limited"); // non-blocking signal for UI banner only
          } catch {
            setError("Failed to load offline data.");
          }
        } else {
          setError("Failed to fetch tracking data.");
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [dataSource, apiKey]);

  const handleReset = () => {
    progressRef.current = 0;
    mapProgressRef.current = 0;
    setProgress(0);
    setMapProgress(0);
    setIsPlaying(false);
    mapModeRef.current = "3d";
    setMapMode("3d");
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
    handleReset,
  };
}
