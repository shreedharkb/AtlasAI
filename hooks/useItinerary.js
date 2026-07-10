"use client";

import { useState, useCallback, useRef } from "react";
import { parseItinerary } from "@/lib/parseItinerary";
import { v4Fallback } from "@/lib/idGenerator";

/**
 * Core state machine for the trip planner.
 * States: idle → loading → success | error
 * 
 * Handles:
 * - Generating itineraries from prompts
 * - Refining existing itineraries with follow-up prompts
 * - CRUD operations on days and stops
 * - Request ID tracking to prevent stale response overwrites
 * - AbortController to cancel in-flight requests
 */
export function useItinerary() {
  const [state, setState] = useState("idle"); // idle | loading | streaming | success | error
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [streamingText, setStreamingText] = useState("");

  // Request tracking to prevent stale responses
  const currentRequestId = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Generate a new itinerary from a prompt
   */
  const generateItinerary = useCallback(async (prompt) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    currentRequestId.current = requestId;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Set a 45-second timeout to abort slow/hanging requests
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === abortController) {
        abortController.abort(new Error("Timeout"));
      }
    }, 45000);

    setState("streaming");
    setStreamingText("");
    setError(null);
    setWarnings([]);
    setOriginalPrompt(prompt);

    try {
      const response = await fetch("/api/stream-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, requestId }),
        signal: abortController.signal,
      });

      // Check if this request is still the current one
      if (currentRequestId.current !== requestId) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Server error: ${response.status}`, {
          cause: { type: errorData.type || "server", status: response.status },
        });
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (currentRequestId.current !== requestId) return;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingText(fullText);
      }

      // Stream complete — parse the full response
      if (currentRequestId.current !== requestId) return;

      const result = parseItinerary(fullText);

      if (!result.success) {
        throw new Error(result.error.message, {
          cause: { type: result.error.type, rawText: result.rawText },
        });
      }

      setItinerary(result.data);
      setWarnings(result.warnings || []);
      setStreamingText("");
      setState("success");
    } catch (err) {
      if (err.name === "AbortError" || err.message === "Timeout") {
        if (abortController.signal.reason?.message === "Timeout" || err.message === "Timeout") {
          if (currentRequestId.current === requestId) {
            setError({
              type: "timeout",
              message: "The AI took longer than 45 seconds to respond. Try a simpler trip description.",
            });
            setStreamingText("");
            setState("error");
          }
        }
        return;
      }
      if (currentRequestId.current !== requestId) return;

      const errorType = err.cause?.type || "network";
      setError({
        type: errorType,
        message: err.message,
        rawText: err.cause?.rawText,
      });
      setStreamingText("");
      setState("error");
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  /**
   * Refine the existing itinerary with a follow-up prompt
   */
  const refineItinerary = useCallback(async (refinementPrompt) => {
    if (!itinerary) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const requestId = `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    currentRequestId.current = requestId;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === abortController) {
        abortController.abort(new Error("Timeout"));
      }
    }, 45000);

    setState("loading");
    setError(null);

    try {
      // Strip UI-only fields before sending to AI
      const cleanItinerary = {
        tripTitle: itinerary.tripTitle,
        summary: itinerary.summary,
        days: itinerary.days.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          stops: day.stops.map((stop) => ({
            id: stop.id,
            name: stop.name,
            time: stop.time,
            duration: stop.duration,
            description: stop.description,
            category: stop.category,
            tips: stop.tips,
          })),
        })),
        blocks: itinerary.blocks || [],
      };

      const response = await fetch("/api/refine-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: refinementPrompt,
          currentItinerary: cleanItinerary,
          requestId,
        }),
        signal: abortController.signal,
      });

      if (currentRequestId.current !== requestId) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Server error: ${response.status}`, {
          cause: { type: errorData.type || "server" },
        });
      }

      const data = await response.json();
      if (currentRequestId.current !== requestId) return;

      const result = parseItinerary(data.content);

      if (!result.success) {
        throw new Error(result.error.message, {
          cause: { type: result.error.type },
        });
      }

      // Preserve existing blocks if model returns none during refinement
      if (!result.data.blocks || result.data.blocks.length === 0) {
        result.data.blocks = itinerary.blocks || [];
      }

      setItinerary(result.data);
      setWarnings(result.warnings || []);
      setState("success");
    } catch (err) {
      if (err.name === "AbortError" || err.message === "Timeout") {
        if (abortController.signal.reason?.message === "Timeout" || err.message === "Timeout") {
          if (currentRequestId.current === requestId) {
            setError({
              type: "timeout",
              message: "The AI refinement took longer than 45 seconds. Please try a simpler modification.",
            });
            setState("error");
          }
        }
        return;
      }
      if (currentRequestId.current !== requestId) return;

      setError({
        type: err.cause?.type || "network",
        message: err.message,
      });
      setState("error");
    } finally {
      clearTimeout(timeoutId);
    }
  }, [itinerary]);

  /**
   * Remove a stop from a specific day
   */
  const removeStop = useCallback((dayIndex, stopId) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const newDays = prev.days.map((day, idx) => {
        if (idx !== dayIndex) return day;
        return {
          ...day,
          stops: day.stops.filter((stop) => stop.id !== stopId),
        };
      });
      return { ...prev, days: newDays };
    });
  }, []);

  /**
   * Reorder stops within a day
   */
  const reorderStops = useCallback((dayIndex, oldIndex, newIndex) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex] };
      const stops = [...day.stops];
      const [removed] = stops.splice(oldIndex, 1);
      stops.splice(newIndex, 0, removed);
      day.stops = stops;
      newDays[dayIndex] = day;
      return { ...prev, days: newDays };
    });
  }, []);

  /**
   * Move a stop from one day to another
   */
  const moveStopBetweenDays = useCallback((fromDayIndex, toDayIndex, stopId, toIndex) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const newDays = [...prev.days];

      // Find and remove from source day
      const fromDay = { ...newDays[fromDayIndex] };
      const stopIndex = fromDay.stops.findIndex((s) => s.id === stopId);
      if (stopIndex === -1) return prev;

      const [movedStop] = fromDay.stops.splice(stopIndex, 1);
      fromDay.stops = [...fromDay.stops];
      newDays[fromDayIndex] = fromDay;

      // Add to target day
      const toDay = { ...newDays[toDayIndex] };
      const newStops = [...toDay.stops];
      newStops.splice(toIndex ?? newStops.length, 0, movedStop);
      toDay.stops = newStops;
      newDays[toDayIndex] = toDay;

      return { ...prev, days: newDays };
    });
  }, []);

  /**
   * Toggle day expand/collapse
   */
  const toggleDayExpand = useCallback((dayIndex) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const newDays = prev.days.map((day, idx) => {
        if (idx !== dayIndex) return day;
        return { ...day, isExpanded: !day.isExpanded };
      });
      return { ...prev, days: newDays };
    });
  }, []);

  /**
   * Add a custom stop to a day
   */
  const addStop = useCallback((dayIndex, stopData) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex] };
      day.stops = [
        ...day.stops,
        {
          id: v4Fallback(),
          name: stopData.name || "New Stop",
          time: stopData.time || "",
          duration: stopData.duration || "",
          description: stopData.description || "",
          category: stopData.category || "other",
          tips: stopData.tips || "",
        },
      ];
      newDays[dayIndex] = day;
      return { ...prev, days: newDays };
    });
  }, []);

  /**
   * Reset everything to initial state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState("idle");
    setItinerary(null);
    setError(null);
    setWarnings([]);
    setOriginalPrompt("");
    currentRequestId.current = null;
  }, []);

  /**
   * Load a previously saved itinerary
   */
  const loadItinerary = useCallback((savedData) => {
    if (savedData?.itinerary) {
      setItinerary(savedData.itinerary);
      setOriginalPrompt(savedData.prompt || "");
      setState("success");
    }
  }, []);

  return {
    // State
    state,
    itinerary,
    error,
    warnings,
    originalPrompt,
    streamingText,

    // Actions
    generateItinerary,
    refineItinerary,
    removeStop,
    reorderStops,
    moveStopBetweenDays,
    toggleDayExpand,
    addStop,
    reset,
    loadItinerary,
  };
}
