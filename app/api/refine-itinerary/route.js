import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a professional travel planner AI. The user has an existing trip itinerary and wants to modify it based on their follow-up request.

You will receive the current itinerary as JSON and a modification request. You must return the COMPLETE UPDATED itinerary in the same JSON format — not just the changes.

The JSON must follow this exact structure:
{
  "tripTitle": "string",
  "summary": "string",
  "days": [
    {
      "dayNumber": 1,
      "title": "string",
      "stops": [
        {
          "id": "string",
          "name": "string",
          "time": "string",
          "duration": "string",
          "description": "string",
          "category": "string - one of: culture, food, nature, shopping, transport, accommodation, adventure, nightlife, relaxation",
          "tips": "string"
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
        { "label": "Food & Dining", "amount": 80, "currency": "USD" }
      ]
    },
    {
      "type": "checklist",
      "title": "Packing Essentials",
      "items": ["string"]
    },
    {
      "type": "tips",
      "title": "Local Travel Tips",
      "items": ["string"]
    }
  ]
}

Rules:
- Return ONLY valid JSON, no markdown, no explanation.
- Keep stops and blocks the user hasn't asked to change.
- Maintain logical time flow when adding/moving stops.
- Generate new unique IDs for any new stops (format: "stop-{dayNumber}-{stopNumber}").
- ALWAYS include the "blocks" array preserving or updating existing budget, checklist, and tips blocks.
- Update the trip title and summary if the changes warrant it.`;

export async function POST(request) {
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

  const { prompt, currentItinerary, requestId } = body;

  if (!prompt || !currentItinerary) {
    return NextResponse.json(
      { error: "Both prompt and current itinerary are required", type: "validation" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const userMessage = `Here is the current itinerary:
\`\`\`json
${JSON.stringify(currentItinerary, null, 2)}
\`\`\`

User's modification request: "${prompt}"

Return the COMPLETE updated itinerary as JSON.`;

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
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 3000,
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
          { error: "Rate limit exceeded. Please try again.", type: "rate_limit" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: errorData.error?.message || `Groq API error: ${response.status}`, type: "server" },
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
        { error: "Request timed out", type: "timeout" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: `Network error: ${err.message}`, type: "network" },
      { status: 502 }
    );
  }
}
