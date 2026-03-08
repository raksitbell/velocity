const BASE_URL = "https://api.nasa.gov/neo/rest/v1";
const CACHE_VERSION = "v2";         // bumped for new live api caching
const CACHE_TTL_MS  = 60 * 60 * 1000; // 1 hour in ms

export interface Asteroid {
  id: string;
  name: string;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    relative_velocity: {
      kilometers_per_hour: string;
    };
    miss_distance: {
      kilometers: string;
    };
    orbiting_body: string;
  }>;
  is_sentry_object: boolean;
}

export interface NeoFeedResponse {
  element_count: number;
  near_earth_objects: {
    [date: string]: Asteroid[];
  };
}

// ─── Offline Database ────────────────────────────────────────────────────────
// Fetches the bundled JSON from public/ if it's not already in localStorage
async function getOfflineDatabase(): Promise<NeoFeedResponse> {
  const DB_KEY = "vel_settings_offlineDb";
  
  if (typeof window !== "undefined") {
    const localDb = localStorage.getItem(DB_KEY);
    if (localDb) {
      try {
        const parsed = JSON.parse(localDb);
        if (parsed.element_count) return parsed;
      } catch (e) {
        console.warn("Failed to parse local offline DB, re-fetching...");
      }
    }
  }

  // Fetch the shipped static backup database
  const res = await fetch("/nasa_data.json");
  if (!res.ok) throw new Error("Offline DB missing from public folder");
  
  const data = await res.json();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(data));
    } catch {
       // local storage is full or disabled
    }
  }
  return data;
}

// ─── localStorage helpers (For Live caching) ─────────────────────────────────
function cacheKey(startDate: string, endDate: string) {
  return `nasa_neofeed_${CACHE_VERSION}_${startDate}_${endDate}`;
}

function readCache(key: string): NeoFeedResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(key); // expired
      return null;
    }
    console.info("[NASA] Serving asteroid live data from fast cache.");
    return data as NeoFeedResponse;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: NeoFeedResponse) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // localStorage may be full or disabled — silently ignore
  }
}

export class NasaRateLimitError extends Error {
  constructor() {
    super("NASA API Rate Limit Exceeded (429). Please use the DEMO_KEY or your own API key.");
    this.name = "NasaRateLimitError";
  }
}

// ─── Main fetch function ─────────────────────────────────────────────────────
export const fetchAsteroids = async (
  startDate: string,
  endDate: string,
  dataSource: "live" | "offline",
  apiKey: string,
  forceNetwork: boolean = false
): Promise<NeoFeedResponse> => {
  
  // 1. Offline Mode handling
  if (dataSource === "offline") {
    console.info("[NASA] Loading from Offline Database");
    return await getOfflineDatabase();
  }

  // 2. Live NASA API handling
  const key = cacheKey(startDate, endDate);
  
  if (!forceNetwork) {
    const cached = readCache(key);
    if (cached) return cached;
  }

  try {
    console.info(`[NASA] Fetching live data from api.nasa.gov (forceNetwork: ${forceNetwork})...`);
    const response = await fetch(
      `${BASE_URL}/feed?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}`
    );

    if (response.status === 429) {
      throw new NasaRateLimitError();
    }
    
    if (!response.ok) {
      throw new Error(`NASA API ${response.status}`);
    }

    const data: NeoFeedResponse = await response.json();
    writeCache(key, data); // persist for 1 hour
    return data;
  } catch (err) {
    if (err instanceof NasaRateLimitError) {
      // Re-throw rate limit errors directly to the UI layer
      throw err;
    }
    console.error("NASA API Live Fetch failed, reverting to Offline Database fallback", err);
    return await getOfflineDatabase();
  }
};

