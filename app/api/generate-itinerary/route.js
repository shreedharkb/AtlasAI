import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a professional travel planner AI. When given a trip description, you MUST return a JSON object (and nothing else — no markdown, no explanation, just raw JSON).

The JSON must follow this exact structure:
{
  "tripTitle": "string - a catchy title for the trip",
  "summary": "string - 1-2 sentence overview of the trip",
  "days": [
    {
      "dayNumber": 1,
      "title": "string - theme for the day e.g. 'Arrival & Exploring Old Town'",
      "stops": [
        {
          "id": "string - unique id like 'stop-1-1'",
          "name": "string - place or activity name",
          "time": "string - suggested time e.g. '9:00 AM'",
          "duration": "string - e.g. '2 hours'",
          "description": "string - 1-2 sentences about this stop",
          "category": "string - one of: culture, food, nature, shopping, transport, accommodation, adventure, nightlife, relaxation",
          "tips": "string - practical tip for this stop"
        }
      ]
    }
  ],
  "blocks": [
    {
      "type": "budget",
      "title": "Estimated Budget Breakdown",
      "items": [
        { "label": "Accommodation", "amount": 150, "currency": "USD" },
        { "label": "Food & Dining", "amount": 80, "currency": "USD" },
        { "label": "Transport", "amount": 40, "currency": "USD" },
        { "label": "Activities", "amount": 60, "currency": "USD" },
        { "label": "Shopping & Misc", "amount": 30, "currency": "USD" }
      ]
    },
    {
      "type": "checklist",
      "title": "Packing Essentials",
      "items": ["Passport", "Comfortable walking shoes", "Sunscreen", "Camera", "Power adapter"]
    },
    {
      "type": "tips",
      "title": "Local Travel Tips",
      "items": ["tip 1", "tip 2", "tip 3"]
    }
  ]
}

Rules:
- Return ONLY valid JSON, no markdown formatting, no code blocks, no extra text.
- Each day should have 3-6 stops.
- Use realistic timings that flow logically through the day.
- Categories must be one of: culture, food, nature, shopping, transport, accommodation, adventure, nightlife, relaxation.
- IDs must be unique across the entire itinerary (use format "stop-{dayNumber}-{stopNumber}").
- ALWAYS include the "blocks" array with budget, checklist, and tips.
- Budget should be realistic per-day estimates in local currency.
- Packing checklist should be trip-specific.
- Include 3-5 local travel tips.
- Be creative and include local recommendations, not just tourist traps.
- Include practical tips that a real traveler would find useful.`;

export async function POST(request) {
  // Check API key
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured", type: "config" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", type: "parse" },
      { status: 400 }
    );
  }

  const { prompt, requestId } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: "Prompt is required", type: "validation" },
      { status: 400 }
    );
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    let response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    // Automatic fallback: if Groq hits the rate limit (429) on the 70B model, immediately retry with the 8B instant model (higher quota pool)
    if (response.status === 429) {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a moment.", type: "rate_limit" },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: errorData.error?.message || `Groq API error: ${response.status}`,
          type: "server",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI returned an empty response", type: "empty" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      content,
      requestId,
      model: data.model,
      usage: data.usage,
    });
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out after 30 seconds", type: "timeout" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: `Network error: ${err.message}`, type: "network" },
      { status: 502 }
    );
  }
}
