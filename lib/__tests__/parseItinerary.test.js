/**
 * parseItinerary.test.js
 *
 * Test suite for the multi-layer AI response parser.
 * Validates: clean JSON, markdown-wrapped, truncated, empty, wrong shape,
 * string stops, trailing commas, fuzzy field names, and control characters.
 */

import { describe, it, expect } from "vitest";
import { parseItinerary } from "../parseItinerary";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minimal valid itinerary JSON for test assertions */
function makeValidJSON(overrides = {}) {
  const base = {
    tripTitle: "Test Trip",
    summary: "A quick test trip",
    days: [
      {
        dayNumber: 1,
        title: "Day One",
        stops: [
          {
            id: "stop-1-1",
            name: "Central Park",
            time: "9:00 AM",
            duration: "2 hours",
            description: "A beautiful park.",
            category: "nature",
            tips: "Wear comfy shoes",
          },
        ],
      },
    ],
    blocks: [],
    ...overrides,
  };
  return JSON.stringify(base);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("parseItinerary", () => {
  // 1. Clean, well-formed JSON
  it("parses valid JSON correctly", () => {
    const result = parseItinerary(makeValidJSON());
    expect(result.success).toBe(true);
    expect(result.data.tripTitle).toBe("Test Trip");
    expect(result.data.days).toHaveLength(1);
    expect(result.data.days[0].stops).toHaveLength(1);
    expect(result.data.days[0].stops[0].name).toBe("Central Park");
    expect(result.warnings).toEqual([]);
  });

  // 2. Empty / null / undefined input
  it("returns error for empty input", () => {
    expect(parseItinerary("").success).toBe(false);
    expect(parseItinerary(null).success).toBe(false);
    expect(parseItinerary(undefined).success).toBe(false);
    expect(parseItinerary("   ").success).toBe(false);

    const result = parseItinerary("");
    expect(result.error.type).toBe("empty");
  });

  // 3. Markdown-wrapped JSON (```json ... ```)
  it("extracts JSON from markdown code blocks", () => {
    const wrapped = "Here is your itinerary:\n```json\n" + makeValidJSON() + "\n```\nEnjoy!";
    const result = parseItinerary(wrapped);
    expect(result.success).toBe(true);
    expect(result.data.tripTitle).toBe("Test Trip");
  });

  // 4. JSON embedded in prose text
  it("finds JSON object embedded in surrounding text", () => {
    const embedded = "Sure! Here's your trip: " + makeValidJSON() + " Hope you like it!";
    const result = parseItinerary(embedded);
    expect(result.success).toBe(true);
    expect(result.data.days[0].stops[0].name).toBe("Central Park");
  });

  // 5. Truncated JSON (streaming cut mid-token)
  it("repairs truncated JSON by closing open brackets", () => {
    const full = makeValidJSON();
    // Cut roughly halfway through to simulate a streaming cutoff
    const truncated = full.substring(0, Math.floor(full.length * 0.85));
    const result = parseItinerary(truncated);

    // Should still succeed — the parser salvages valid prefixes
    expect(result.success).toBe(true);
    expect(result.data.tripTitle).toBe("Test Trip");
  });

  // 6. Trailing commas (common LLM mistake)
  it("handles trailing commas in arrays and objects", () => {
    const withCommas = `{
      "tripTitle": "Comma Trip",
      "summary": "Testing commas",
      "days": [
        {
          "dayNumber": 1,
          "title": "Day One",
          "stops": [
            {
              "id": "stop-1-1",
              "name": "Museum",
              "time": "10:00 AM",
              "duration": "3 hours",
              "description": "Art museum",
              "category": "culture",
              "tips": "Free on Tuesdays",
            },
          ],
        },
      ],
      "blocks": [],
    }`;

    const result = parseItinerary(withCommas);
    expect(result.success).toBe(true);
    expect(result.data.tripTitle).toBe("Comma Trip");
  });

  // 7. Fuzzy field names (snake_case, alternative keys)
  it("normalizes alternative field names (snake_case, synonyms)", () => {
    const altKeys = JSON.stringify({
      trip_title: "Snake Case Trip",
      description: "Uses snake_case",
      schedule: [
        {
          day_number: 1,
          theme: "Exploring",
          activities: [
            {
              id: "s1",
              place: "Eiffel Tower",
              startTime: "9:00 AM",
              length: "1 hour",
              about: "Iconic landmark",
              type: "culture",
              notes: "Book skip-the-line",
            },
          ],
        },
      ],
    });

    const result = parseItinerary(altKeys);
    expect(result.success).toBe(true);
    expect(result.data.tripTitle).toBe("Snake Case Trip");
    expect(result.data.summary).toBe("Uses snake_case");
    expect(result.data.days[0].stops[0].name).toBe("Eiffel Tower");
    expect(result.data.days[0].stops[0].tips).toBe("Book skip-the-line");
  });

  // 8. String stops (model returns stop as plain string instead of object)
  it("handles stops that are plain strings instead of objects", () => {
    const stringStops = JSON.stringify({
      tripTitle: "String Stop Trip",
      summary: "Stops as strings",
      days: [
        {
          dayNumber: 1,
          title: "Day 1",
          stops: ["Visit the Louvre", "Lunch at a cafe", "Seine river walk"],
        },
      ],
    });

    const result = parseItinerary(stringStops);
    expect(result.success).toBe(true);
    expect(result.data.days[0].stops).toHaveLength(3);
    expect(result.data.days[0].stops[0].name).toBe("Visit the Louvre");
    // String stops get category "other"
    expect(result.data.days[0].stops[0].category).toBe("other");
  });

  // 9. Unknown category → fuzzy match fallback
  it("fuzzy-matches unknown categories from stop names", () => {
    const unknownCat = JSON.stringify({
      tripTitle: "Category Test",
      summary: "Testing fuzzy match",
      days: [
        {
          dayNumber: 1,
          title: "Day 1",
          stops: [
            {
              id: "s1",
              name: "Sushi Restaurant Tsukiji",
              time: "12:00 PM",
              duration: "1h",
              description: "Best sushi in town",
              category: "gastronomy",
              tips: "",
            },
            {
              id: "s2",
              name: "Mountain hiking trail",
              time: "3:00 PM",
              duration: "4h",
              description: "Scenic mountain hike",
              category: "outdoor_activity",
              tips: "",
            },
          ],
        },
      ],
    });

    const result = parseItinerary(unknownCat);
    expect(result.success).toBe(true);
    // "gastronomy" + "restaurant" in name → should fuzzy to "food"
    expect(result.data.days[0].stops[0].category).toBe("food");
    // "outdoor_activity" + "mountain" + "hike" → should fuzzy to "nature"
    expect(result.data.days[0].stops[1].category).toBe("nature");
  });

  // 10. No days at all → structural error
  it("returns error when no days are present", () => {
    const noDays = JSON.stringify({
      tripTitle: "Empty Trip",
      summary: "No days here",
    });

    const result = parseItinerary(noDays);
    expect(result.success).toBe(false);
    expect(result.error.type).toBe("shape");
  });

  // 11. Unescaped control characters inside JSON strings
  it("handles unescaped newlines and tabs inside JSON string values", () => {
    // Simulate the model outputting literal newlines inside a JSON string value
    const raw = '{"tripTitle": "Trip with\\nnewline", "summary": "Has a\ttab", "days": [{"dayNumber": 1, "title": "Day 1", "stops": [{"id": "s1", "name": "Place", "time": "9 AM", "duration": "1h", "description": "Desc", "category": "culture", "tips": ""}]}]}';
    const result = parseItinerary(raw);
    expect(result.success).toBe(true);
  });

  // 12. Wrapped in parent key (e.g. { "itinerary": { ... } })
  it("unwraps itinerary from parent wrapper keys", () => {
    const wrapped = JSON.stringify({
      itinerary: {
        tripTitle: "Wrapped Trip",
        summary: "Nested inside 'itinerary' key",
        days: [
          {
            dayNumber: 1,
            title: "Day 1",
            stops: [
              { id: "s1", name: "Temple", time: "8 AM", duration: "2h", description: "A temple", category: "culture", tips: "" },
            ],
          },
        ],
      },
    });

    const result = parseItinerary(wrapped);
    expect(result.success).toBe(true);
    expect(result.data.tripTitle).toBe("Wrapped Trip");
  });

  // 13. Blocks (budget, checklist, tips) are correctly normalized
  it("normalizes budget, checklist, and tips blocks", () => {
    const withBlocks = makeValidJSON({
      blocks: [
        {
          type: "budget",
          title: "Budget",
          items: [
            { label: "Hotel", amount: 200, currency: "EUR" },
            { label: "Food", amount: 80, currency: "EUR" },
          ],
        },
        {
          type: "checklist",
          title: "Packing",
          items: ["Passport", "Sunscreen", "Camera"],
        },
        {
          type: "tips",
          title: "Tips",
          items: ["Tip 1", "Tip 2"],
        },
      ],
    });

    const result = parseItinerary(withBlocks);
    expect(result.success).toBe(true);
    expect(result.data.blocks).toHaveLength(3);
    expect(result.data.blocks[0].type).toBe("budget");
    expect(result.data.blocks[0].items[0].amount).toBe(200);
    expect(result.data.blocks[1].type).toBe("checklist");
    expect(result.data.blocks[1].items).toContain("Passport");
    expect(result.data.blocks[2].type).toBe("tips");
  });
});
