import { NextResponse } from "next/server";
import { GENERATE_SYSTEM_PROMPT, MAX_PROMPT_LENGTH } from "@/lib/prompts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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

  // Cap prompt length to prevent token-limit abuse
  const sanitizedPrompt = prompt.trim().slice(0, MAX_PROMPT_LENGTH);

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
          { role: "system", content: GENERATE_SYSTEM_PROMPT },
          { role: "user", content: sanitizedPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
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
            { role: "system", content: GENERATE_SYSTEM_PROMPT },
            { role: "user", content: sanitizedPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
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
