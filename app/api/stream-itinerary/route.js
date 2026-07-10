import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a professional travel planner AI. When given a trip description, return a JSON object (and nothing else — no markdown, no explanation, just raw JSON).

The JSON must follow this exact structure:
{
  "tripTitle": "string - a catchy title for the trip",
  "summary": "string - 1-2 sentence overview of the trip",
  "days": [
    {
      "dayNumber": 1,
      "title": "string - theme for the day",
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
      "items": [
        "string - practical travel tip 1",
        "string - practical travel tip 2",
        "string - practical travel tip 3"
      ]
    }
  ]
}

Rules:
- Return ONLY valid JSON. No markdown, no code blocks, no explanation.
- Each day should have 3-6 stops.
- Use realistic timings.
- Categories: culture, food, nature, shopping, transport, accommodation, adventure, nightlife, relaxation.
- IDs must be unique (format: "stop-{dayNumber}-{stopNumber}").
- ALWAYS include the "blocks" array with budget, checklist, and tips blocks.
- Budget amounts should be realistic per-day estimates in the local currency.
- Packing checklist should be trip-specific (cold weather gear for mountains, swimwear for beaches, etc).
- Include 3-5 local travel tips.
- Be creative and include local recommendations.`;

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

  const { prompt, requestId } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: "Prompt is required", type: "validation" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

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
        max_tokens: 3000,
        response_format: { type: "json_object" },
        stream: true,
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
          max_tokens: 3000,
          response_format: { type: "json_object" },
          stream: true,
        }),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded.", type: "rate_limit" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: errorData.error?.message || `Groq API error: ${response.status}`, type: "server" },
        { status: response.status }
      );
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(streamController) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  streamController.enqueue(
                    new TextEncoder().encode(content)
                  );
                }
              } catch {
                // Skip malformed SSE chunks
              }
            }
          }
          
          // Process any remaining buffer after the stream ends
          if (buffer) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data: ")) {
              const data = trimmed.slice(6);
              if (data !== "[DONE]") {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    streamController.enqueue(new TextEncoder().encode(content));
                  }
                } catch {
                  // Skip
                }
              }
            }
          }
        } catch (err) {
          streamController.error(err);
        } finally {
          streamController.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Request-Id": requestId || "",
        "Transfer-Encoding": "chunked",
      },
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
