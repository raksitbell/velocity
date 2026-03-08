"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Database, Globe, RefreshCcw, Save } from "lucide-react";
import { useSettings, DataSource } from "@/hooks/useSettings";
import { useState } from "react";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { dataSource, setDataSource, apiKey, setApiKey, lastSynced, setLastSynced } = useSettings();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync state when dialog opens
  if (isOpen && localApiKey !== apiKey) {
    // Only update local input if it doesn't match the global context when opening
    setLocalApiKey(apiKey);
  }

  const handleSaveConfig = () => {
    setApiKey(localApiKey);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const DB_KEY = "vel_settings_offlineDb";
      const res = await fetch("/nasa_data.json");
      const data = await res.json();
      localStorage.setItem(DB_KEY, JSON.stringify(data));
      
      // Simulate slight delay for UX
      await new Promise(r => setTimeout(r, 600));
      alert("Offline database successfully synchronized into LocalStorage.");
    } catch (e) {
      alert("Failed to sync offline JSON database. Ensure /nasa_data.json exists exist in public.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-cyan-400" />
                System Configurations
              </h2>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Data Source Toggle */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                  Telemetry Data Source
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDataSource("live")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      dataSource === "live"
                        ? "bg-cyan-900/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    <Globe className="w-6 h-6" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Live API</span>
                  </button>
                  <button
                    onClick={() => setDataSource("offline")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      dataSource === "offline"
                        ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    <Database className="w-6 h-6" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Offline DB</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                  {dataSource === "live"
                    ? "Live mode fetches everyday directly from api.nasa.gov."
                    : "Offline mode reads from native browser LocalStorage without network requests."}
                </p>
              </div>

// ...
              {/* API Key Input (only relevant if Live) */}
              <div className={`space-y-3 transition-opacity duration-300 ${dataSource === "offline" ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                    NASA API Key
                  </h3>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-500/80">
                    Last Pulled: {lastSynced ? new Date(lastSynced).toLocaleString() : "Unknown"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="DEMO_KEY"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                  <button
                    onClick={handleSaveConfig}
                    className="px-4 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 border text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
                
                <button
                    onClick={async () => {
                      setIsSyncing(true);
                      try {
                        const { format, addDays } = await import("date-fns");
                        const { fetchAsteroids } = await import("@/services/nasaService");
                        const today = new Date();
                        await fetchAsteroids(
                           format(today, "yyyy-MM-dd"),
                           format(addDays(today, 1), "yyyy-MM-dd"),
                           "live",
                           localApiKey,
                           true // Force network rebuilds cache natively
                        );
                        setLastSynced(Date.now());
                        alert("Successfully forced a live data pull from NASA.");
                      } catch (e: any) {
                        alert(e.name === "NasaRateLimitError" ? "NASA API Rate Limit Exceeded (HTTP 429). Change API key." : "Failed to force fetch NASA Data.");
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-950/30 hover:bg-cyan-900/40 border-cyan-900 border text-cyan-400 rounded-lg text-sm font-medium transition-colors mt-2"
                >
                    <RefreshCcw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Connecting to NASA..." : "Force Pull Live NASA Data"}
                </button>
              </div>

              {/* Offline Sync Controls */}
              <div className="pt-4 border-t border-zinc-800">
                 <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 border-zinc-800 border text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                 >
                    <Database className={`w-4 h-4 ${isSyncing ? "animate-pulse text-emerald-500" : ""}`} />
                    {isSyncing ? "Syncing Database..." : "Pre-load Offline Database into LocalStorage"}
                 </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
