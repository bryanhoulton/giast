import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).send("Server configuration error: Missing API key");
  }

  const { prompt, systemPrompt } = req.body;

  if (!prompt) {
    return res.status(400).send("Missing prompt");
  }

  if (!systemPrompt) {
    return res.status(400).send("Missing systemPrompt");
  }

  try {
    const client = new Anthropic({
      apiKey,
    });

    // Set headers for streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(event.delta.text);
      }
    }

    res.end();
  } catch (error) {
    console.error("Anthropic API error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      return res.status(500).send(`API error: ${message}`);
    }
    res.end();
  }
}
