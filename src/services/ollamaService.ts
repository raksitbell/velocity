/**
 * ollamaService.ts
 *
 * Sends prompts to Ollama via one of two channels:
 *
 * 1. Server-side proxy  (/api/ollama/generate)  — works for both local dev
 *    and online deployments where OLLAMA_BASE_URL is configured server-side.
 *
 * 2. Direct browser call  — used when NEXT_PUBLIC_OLLAMA_URL is set OR when
 *    the user has saved a custom URL in localStorage ("ollama_url").  This
 *    allows a deployed app to reach a locally-running Ollama via a tunnel
 *    (ngrok, Cloudflare Tunnel, etc.) without needing a server restart.
 *
 * Priority: localStorage  >  NEXT_PUBLIC_OLLAMA_URL  >  server proxy
 */

const STORAGE_KEY = "ollama_url";
const DEFAULT_MODEL = "llama3";

function resolveOllamaUrl(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored.replace(/\/$/, ""); // strip trailing slash
  const envUrl = process.env.NEXT_PUBLIC_OLLAMA_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return null; // fall back to server proxy
}

export function saveOllamaUrl(url: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, url.trim());
  }
}

export function clearOllamaUrl() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getOllamaUrl(): string {
  return resolveOllamaUrl() || "http://localhost:11434";
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export const askOllama = async (
  prompt: string,
  model = DEFAULT_MODEL
): Promise<string> => {
  const directUrl = resolveOllamaUrl();

  // Attempt direct browser call when a custom / env URL is available
  if (directUrl) {
    try {
      const res = await fetch(`${directUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
      });
      if (res.ok) {
        const data: OllamaResponse = await res.json();
        return data.response;
      }
    } catch {
      console.warn("[ollama] Direct call failed, falling back to proxy.");
    }
  }

  // Fall back to the Next.js server proxy
  try {
    const res = await fetch("/api/ollama/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
    });

    if (!res.ok) {
      throw new Error(`Proxy error ${res.status}`);
    }

    const data: OllamaResponse = await res.json();
    return data.response;
  } catch (err) {
    console.error("[ollama] Proxy call failed:", err);
    return "Unable to reach Ollama. Check your connection or configure a custom URL in Settings.";
  }
};
