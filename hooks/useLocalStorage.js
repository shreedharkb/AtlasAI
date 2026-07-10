"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "trip-planner-sessions";
const MAX_SESSIONS = 10;

/**
 * Hook to persist trip sessions to localStorage.
 * Supports saving, loading, listing, and deleting sessions.
 */
export function useLocalStorage() {
  const [sessions, setSessions] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSessions(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        // If localStorage is corrupted, start fresh
        setSessions([]);
      }
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Save a session
   */
  const saveSession = useCallback((prompt, itinerary) => {
    const session = {
      id: `session-${Date.now()}`,
      prompt,
      itinerary,
      savedAt: new Date().toISOString(),
      title: itinerary?.tripTitle || "Untitled Trip",
    };

    setSessions((prev) => {
      const updated = [session, ...prev].slice(0, MAX_SESSIONS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage might be full
      }
      return updated;
    });

    return session.id;
  }, []);

  /**
   * Load a session by ID
   */
  const loadSession = useCallback((sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    return session || null;
  }, [sessions]);

  /**
   * Delete a session by ID
   */
  const deleteSession = useCallback((sessionId) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  /**
   * Clear all sessions
   */
  const clearSessions = useCallback(() => {
    setSessions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    sessions,
    isLoaded,
    saveSession,
    loadSession,
    deleteSession,
    clearSessions,
  };
}
