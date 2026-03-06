const NASA_API_KEY = process.env.NEXT_PUBLIC_NASA_API_KEY || "DEMO_KEY";
const BASE_URL = "/api/nasa";
const CACHE_VERSION = "v1";         // bump to invalidate old cache entries
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

// ─── Mock fallback when API is unavailable ───────────────────────────────────
function mockFallback(startDate: string): NeoFeedResponse {
  return {
    element_count: 2,
    near_earth_objects: {
      [startDate]: [
        {
          id: "MOCK-1",
          name: "Apophis (Mock)",
          estimated_diameter: {
            kilometers: { estimated_diameter_min: 0.3, estimated_diameter_max: 0.4 },
          },
          is_potentially_hazardous_asteroid: true,
          close_approach_data: [
            {
              close_approach_date: startDate,
              relative_velocity: { kilometers_per_hour: "105000" },
              miss_distance: { kilometers: "38000" },
              orbiting_body: "Earth",
            },
          ],
          is_sentry_object: false,
        },
        {
          id: "MOCK-2",
          name: "Bennu (Mock)",
          estimated_diameter: {
            kilometers: { estimated_diameter_min: 0.4, estimated_diameter_max: 0.5 },
          },
          is_potentially_hazardous_asteroid: true,
          close_approach_data: [
            {
              close_approach_date: startDate,
              relative_velocity: { kilometers_per_hour: "95000" },
              miss_distance: { kilometers: "300000" },
              orbiting_body: "Earth",
            },
          ],
          is_sentry_object: true,
        },
      ],
    },
  };
}

// ─── localStorage helpers ────────────────────────────────────────────────────
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
    console.info("[NASA] Serving asteroid data from cache.");
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

// ─── Main fetch function ─────────────────────────────────────────────────────
export const fetchAsteroids = async (
  startDate: string,
  endDate: string
): Promise<NeoFeedResponse> => {
  const key = cacheKey(startDate, endDate);

  // 1. Try cache first
  const cached = readCache(key);
  if (cached) return cached;

  // 2. Fetch from NASA API
  try {
    const response = await fetch(
      `${BASE_URL}/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}`
    );

    if (!response.ok) {
      console.warn(`NASA API ${response.status} — using mock fallback.`);
      return mockFallback(startDate);
    }

    const data: NeoFeedResponse = await response.json();
    writeCache(key, data); // persist for 1 hour
    return data;
  } catch (err) {
    console.warn("NASA API network error — using mock fallback.", err);
    return mockFallback(startDate);
  }
};

