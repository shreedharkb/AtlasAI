/**
 * parseItinerary.js
 * 
 * Multi-layer parser for AI-generated itinerary data.
 * Handles: malformed JSON, markdown-wrapped JSON, missing fields,
 * wrong types, partial data, and empty responses.
 * 
 * Returns: { success, data, warnings } or { success: false, error, rawText }
 */

import { v4Fallback } from "./idGenerator";

/**
 * Main entry point: takes raw AI response text and returns parsed itinerary
 */
export function parseItinerary(rawResponse) {
  const warnings = [];

  // Step 0: Guard against empty/null input
  if (!rawResponse || typeof rawResponse !== "string" || rawResponse.trim().length === 0) {
    return {
      success: false,
      error: {
        type: "empty",
        message: "The AI returned an empty response.",
      },
      rawText: rawResponse || "",
    };
  }

  // Step 1: Extract JSON from the response
  let parsed;
  try {
    parsed = extractJSON(rawResponse);
  } catch (err) {
    return {
      success: false,
      error: {
        type: "parse",
        message: `Failed to parse AI response as JSON: ${err.message}`,
      },
      rawText: rawResponse,
    };
  }

  // Step 2: Validate and normalize the structure
  try {
    const normalized = normalizeItinerary(parsed, warnings);
    return {
      success: true,
      data: normalized,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        type: "shape",
        message: `AI response has an unexpected structure: ${err.message}`,
      },
      rawText: rawResponse,
    };
  }
}

/**
 * Step 1: Extract JSON from raw text
 * Handles: plain JSON, markdown-wrapped JSON (```json ... ```), 
 * JSON embedded in text
 */
function extractJSON(text) {
  const trimmed = text.trim();

  // Helper to remove illegal trailing commas inside arrays or objects right before closing brackets
  const cleanCommas = (s) => s.replace(/,\s*(?=[\]}])/g, "");

  // Try 1: Direct JSON parse
  try {
    return JSON.parse(cleanCommas(trimmed));
  } catch {
    // Continue to fallbacks
  }

  // Try 2: Extract from markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/;
  const codeBlockMatch = trimmed.match(codeBlockRegex);
  if (codeBlockMatch) {
    try {
      return JSON.parse(cleanCommas(codeBlockMatch[1].trim()));
    } catch {
      // Continue
    }
  }

  // Try 3: Find the first { ... } or [ ... ] block
  const jsonStart = trimmed.indexOf("{");
  const arrayStart = trimmed.indexOf("[");
  let startIdx = -1;

  if (jsonStart === -1 && arrayStart === -1) {
    throw new Error("No JSON object or array found in the response.");
  }

  if (jsonStart === -1) startIdx = arrayStart;
  else if (arrayStart === -1) startIdx = jsonStart;
  else startIdx = Math.min(jsonStart, arrayStart);

  // Find matching closing bracket respecting quoted strings and escape sequences
  let depth = 0;
  let endIdx = -1;
  let inString = false;
  let escape = false;

  const startChar = trimmed[startIdx];
  const closeChar = startChar === "{" ? "}" : "]";

  for (let i = startIdx; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === startChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
  }

  if (endIdx !== -1) {
    const jsonStr = trimmed.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(cleanCommas(jsonStr));
    } catch {
      // If parsing fails despite matching brackets, try repair below
    }
  }

  // Try 4: Truncated JSON auto-repair and iterative prefix salvage
  try {
    return attemptRepairTruncatedJSON(trimmed.substring(startIdx));
  } catch (err) {
    throw new Error(`Found JSON-like block but it's malformed or incomplete: ${err.message}`);
  }
}

/**
 * Auto-repairs truncated JSON strings by closing open strings, removing dangling commas, and iteratively stepping back to salvage valid prefixes
 */
function attemptRepairTruncatedJSON(partialStr) {
  const cleanCommas = (s) => s.replace(/,\s*(?=[\]}])/g, "");

  // Helper to test if a specific partial string can be closed and parsed
  const salvagePrefix = (inputStr) => {
    let str = cleanCommas(inputStr.trim());
    let inStr = false;
    let esc = false;
    const stack = [];

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (esc) {
        esc = false;
        continue;
      }
      if (char === "\\") {
        esc = true;
        continue;
      }
      if (char === '"') {
        inStr = !inStr;
        continue;
      }
      if (!inStr) {
        if (char === "{" || char === "[") {
          stack.push(char);
        } else if (char === "}") {
          if (stack[stack.length - 1] === "{") stack.pop();
        } else if (char === "]") {
          if (stack[stack.length - 1] === "[") stack.pop();
        }
      }
    }

    // If ended mid-string, close the string
    if (inStr) {
      str += '"';
    }

    // Strip dangling commas, colons, or unclosed property names at the end
    let prevStr;
    do {
      prevStr = str;
      str = str.replace(/,\s*$/, "").replace(/:\s*$/, "").replace(/,\s*"[^":,\]}]*"?\s*$/, "").trim();
      str = cleanCommas(str);
    } while (str !== prevStr);

    // Close remaining open brackets in reverse order
    while (stack.length > 0) {
      const openChar = stack.pop();
      str += openChar === "{" ? "}" : "]";
    }

    return JSON.parse(cleanCommas(str));
  };

  // 1. Try salvaging the full partial string directly
  try {
    return salvagePrefix(partialStr);
  } catch {
    // 2. If direct salvage fails (e.g. cut off right inside a property name or malformed token),
    // iteratively step backwards to the last valid separator (',', '{', '[') and salvage that prefix.
    let candidate = partialStr;
    for (let attempts = 0; attempts < 60; attempts++) {
      const lastComma = candidate.lastIndexOf(",");
      const lastOpenBrace = candidate.lastIndexOf("{");
      const lastOpenBracket = candidate.lastIndexOf("[");
      const cutIdx = Math.max(lastComma, lastOpenBrace, lastOpenBracket);

      if (cutIdx <= 0) break;
      candidate = candidate.substring(0, cutIdx).trim();

      try {
        return salvagePrefix(candidate);
      } catch {
        // Continue stepping backward to find the largest valid JSON prefix
      }
    }
    throw new Error("Unable to salvage valid JSON prefix.");
  }
}

/**
 * Step 2: Validate and normalize the itinerary structure
 */
function normalizeItinerary(parsed, warnings) {
  // Handle case where the itinerary is wrapped in a parent key
  let data = parsed;
  if (data.itinerary && typeof data.itinerary === "object") {
    data = data.itinerary;
  }
  if (data.trip && typeof data.trip === "object") {
    data = data.trip;
  }
  if (data.result && typeof data.result === "object") {
    data = data.result;
  }

  // Extract trip title
  const tripTitle = extractString(data, ["tripTitle", "trip_title", "title", "name"], "Your Trip");
  if (tripTitle === "Your Trip") {
    warnings.push("AI didn't provide a trip title — using a default.");
  }

  // Extract summary
  const summary = extractString(data, ["summary", "description", "overview", "intro"], "");

  // Extract days array
  let days = extractArray(data, ["days", "itinerary", "schedule", "dayByDay", "day_by_day"]);

  if (!days || days.length === 0) {
    throw new Error("No days/itinerary found in the response.");
  }

  // Normalize each day
  const normalizedDays = days.map((day, dayIndex) => normalizeDay(day, dayIndex, warnings));

  // Filter out completely empty days
  const validDays = normalizedDays.filter(day => day.stops.length > 0);

  if (validDays.length === 0) {
    throw new Error("All days in the itinerary are empty — no stops found.");
  }

  if (validDays.length < normalizedDays.length) {
    warnings.push(`${normalizedDays.length - validDays.length} empty day(s) were removed.`);
  }

  // Extract blocks (budget, checklist, tips) — optional
  const blocks = normalizeBlocks(data, warnings);

  return {
    tripTitle,
    summary,
    days: validDays,
    blocks,
  };
}

/**
 * Normalize blocks array (budget chart, packing checklist, travel tips)
 */
function normalizeBlocks(data, warnings) {
  let rawBlocks = extractArray(data, ["blocks", "extras", "additional", "widgets"]);
  if (!rawBlocks || rawBlocks.length === 0) {
    // Don't warn — blocks are optional
    return [];
  }

  const normalized = [];

  for (const block of rawBlocks) {
    if (!block || typeof block !== "object") continue;

    const type = (block.type || "").toLowerCase();
    const title = block.title || "";

    if (type === "budget") {
      const items = Array.isArray(block.items) ? block.items : [];
      const validItems = items.filter(
        (item) => item && typeof item === "object" && item.label && typeof item.amount === "number"
      );
      if (validItems.length > 0) {
        normalized.push({
          type: "budget",
          title: title || "Estimated Budget",
          items: validItems.map((item) => ({
            label: String(item.label),
            amount: Number(item.amount),
            currency: String(item.currency || "USD"),
          })),
        });
      }
    } else if (type === "checklist" || type === "packing") {
      const items = Array.isArray(block.items) ? block.items : [];
      const validItems = items.filter((item) => typeof item === "string" && item.trim());
      if (validItems.length > 0) {
        normalized.push({
          type: "checklist",
          title: title || "Packing Checklist",
          items: validItems.map(String),
        });
      }
    } else if (type === "tips" || type === "advice") {
      const items = Array.isArray(block.items) ? block.items : [];
      const validItems = items.filter((item) => typeof item === "string" && item.trim());
      if (validItems.length > 0) {
        normalized.push({
          type: "tips",
          title: title || "Travel Tips",
          items: validItems.map(String),
        });
      }
    }
  }

  return normalized;
}

/**
 * Normalize a single day object
 */
function normalizeDay(day, dayIndex, warnings) {
  const dayNumber = day.dayNumber || day.day_number || day.day || dayIndex + 1;
  const title = extractString(day, ["title", "name", "theme", "label"], `Day ${dayNumber}`);

  let stops = extractArray(day, ["stops", "activities", "places", "events", "items", "locations"]);

  if (!stops || stops.length === 0) {
    warnings.push(`Day ${dayNumber} has no stops.`);
    stops = [];
  }

  const normalizedStops = stops
    .map((stop, stopIndex) => normalizeStop(stop, dayIndex, stopIndex, warnings))
    .filter(Boolean); // Remove nulls from failed parses

  return {
    id: `day-${dayIndex}`,
    dayNumber: Number(dayNumber),
    title: String(title),
    stops: normalizedStops,
    isExpanded: true,
  };
}

/**
 * Normalize a single stop object
 */
function normalizeStop(stop, dayIndex, stopIndex, warnings) {
  if (!stop || typeof stop !== "object") {
    // Handle case where stop is just a string
    if (typeof stop === "string") {
      return {
        id: v4Fallback(),
        name: stop,
        time: "",
        duration: "",
        description: "",
        category: "other",
        tips: "",
      };
    }
    warnings.push(`Invalid stop at day ${dayIndex + 1}, position ${stopIndex + 1}.`);
    return null;
  }

  const name = extractString(stop, ["name", "title", "place", "location", "activity"], `Stop ${stopIndex + 1}`);
  const time = extractString(stop, ["time", "startTime", "start_time", "timing"], "");
  const duration = extractString(stop, ["duration", "length", "time_needed", "timeNeeded"], "");
  const description = extractString(stop, ["description", "desc", "details", "about", "info"], "");
  const tips = extractString(stop, ["tips", "tip", "notes", "note", "advice"], "");

  // Normalize category
  let category = extractString(stop, ["category", "type", "tag", "kind"], "other").toLowerCase();
  const validCategories = [
    "culture", "food", "nature", "shopping", "transport",
    "accommodation", "adventure", "nightlife", "relaxation", "other",
  ];
  if (!validCategories.includes(category)) {
    // Try to fuzzy match
    category = fuzzyMatchCategory(category, name, description);
  }

  return {
    id: stop.id || v4Fallback(),
    name: String(name),
    time: String(time),
    duration: String(duration),
    description: String(description),
    category,
    tips: String(tips),
  };
}

/**
 * Helper: extract a string value from an object, trying multiple key names
 */
function extractString(obj, keys, defaultValue) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return String(obj[key]);
    }
  }
  return defaultValue;
}

/**
 * Helper: extract an array from an object, trying multiple key names
 */
function extractArray(obj, keys) {
  for (const key of keys) {
    if (Array.isArray(obj[key])) {
      return obj[key];
    }
  }
  // Maybe the object itself is an array
  if (Array.isArray(obj)) return obj;
  return null;
}

/**
 * Helper: try to determine category from name/description keywords
 */
function fuzzyMatchCategory(rawCategory, name, description) {
  const text = `${rawCategory} ${name} ${description}`.toLowerCase();

  const categoryKeywords = {
    food: ["food", "restaurant", "eat", "dining", "cafe", "lunch", "dinner", "breakfast", "cuisine", "street food", "market"],
    culture: ["temple", "museum", "heritage", "historic", "monument", "palace", "church", "shrine", "gallery", "art"],
    nature: ["park", "garden", "beach", "mountain", "lake", "waterfall", "forest", "hike", "trail", "scenic"],
    shopping: ["shop", "mall", "market", "bazaar", "store", "souvenir", "buy"],
    transport: ["flight", "train", "bus", "drive", "travel", "transit", "transfer", "airport", "station"],
    accommodation: ["hotel", "hostel", "check-in", "check-out", "stay", "resort", "airbnb", "lodge"],
    adventure: ["adventure", "sport", "surf", "dive", "climb", "kayak", "zip", "bungee", "rafting", "snorkel"],
    nightlife: ["bar", "club", "night", "pub", "lounge", "party", "cocktail", "live music"],
    relaxation: ["spa", "relax", "massage", "yoga", "meditation", "wellness", "pool"],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      return category;
    }
  }

  return "other";
}
