import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ollama/generate
 *
 * Proxies requests to an Ollama instance. The base URL is resolved in this
 * priority order:
 *   1. `OLLAMA_BASE_URL` server-side env var  (set in Vercel / hosting env)
 *   2. `NEXT_PUBLIC_OLLAMA_URL` env var        (can be client-visible)
 *   3. http://localhost:11434                  (local development default)
 *
 * When deployed online and the user's Ollama is running locally they should
 * either:
 *   a) Set OLLAMA_BASE_URL to an ngrok / Cloudflare tunnel URL in their
 *      hosting environment, or
 *   b) Set the custom URL via the in-app Settings and let the browser call
 *      Ollama directly (the JS client will use NEXT_PUBLIC_OLLAMA_URL or
 *      the localStorage value set through the UI).
 */
export async function POST(req: NextRequest) {
  const baseUrl =
    process.env.OLLAMA_BASE_URL ||
    process.env.NEXT_PUBLIC_OLLAMA_URL ||
    "http://localhost:11434";

  const body = await req.json();

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Ollama returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[ollama proxy] fetch failed:", err);
    return NextResponse.json(
      { error: "Could not reach Ollama. Is it running?" },
      { status: 503 }
    );
  }
}
