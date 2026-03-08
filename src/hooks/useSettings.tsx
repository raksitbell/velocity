"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";

export type DataSource = "live" | "offline";

interface SettingsState {
  dataSource: DataSource;
  apiKey: string;
  autoFetchDaily: boolean;
  lastSynced: number | null;
  setDataSource: (source: DataSource) => void;
  setApiKey: (key: string) => void;
  setAutoFetchDaily: (auto: boolean) => void;
  setLastSynced: (ts: number | null) => void;
}

const defaultSettings: SettingsState = {
  dataSource: "live",
  apiKey: "DEMO_KEY",
  autoFetchDaily: true,
  lastSynced: null,
  setDataSource: () => {},
  setApiKey: () => {},
  setAutoFetchDaily: () => {},
  setLastSynced: () => {},
};

const SettingsContext = createContext<SettingsState>(defaultSettings);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [dataSource, setDataSourceState] = useState<DataSource>("live");
  const [apiKey, setApiKeyState] = useState("DEMO_KEY");
  const [autoFetchDaily, setAutoFetchDailyState] = useState(true);
  const [lastSynced, setLastSyncedState] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedSource = localStorage.getItem("vel_settings_dataSource");
      const storedKey = localStorage.getItem("vel_settings_apiKey");
      const storedAuto = localStorage.getItem("vel_settings_autoFetchDaily");
      const storedLastSync = localStorage.getItem("vel_settings_lastSynced");

      if (storedSource === "live" || storedSource === "offline") setDataSourceState(storedSource);
      if (storedKey) setApiKeyState(storedKey);
      if (storedAuto !== null) setAutoFetchDailyState(storedAuto === "true");
      if (storedLastSync) setLastSyncedState(parseInt(storedLastSync, 10));
    } catch {
      // ignore localStorage errors (e.g. incognito)
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setDataSource = (source: DataSource) => {
    setDataSourceState(source);
    localStorage.setItem("vel_settings_dataSource", source);
  };

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem("vel_settings_apiKey", key);
  };

  const setAutoFetchDaily = (auto: boolean) => {
    setAutoFetchDailyState(auto);
    localStorage.setItem("vel_settings_autoFetchDaily", auto ? "true" : "false");
  };

  const setLastSynced = (ts: number | null) => {
    setLastSyncedState(ts);
    if (ts !== null) {
      localStorage.setItem("vel_settings_lastSynced", ts.toString());
    } else {
      localStorage.removeItem("vel_settings_lastSynced");
    }
  };

  if (!isLoaded) return null as any; // Avoid hydration mismatch

  return (
    <SettingsContext.Provider
      value={{
        dataSource,
        apiKey,
        autoFetchDaily,
        lastSynced,
        setDataSource,
        setApiKey,
        setAutoFetchDaily,
        setLastSynced,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
