import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, makeRateLimiter } from "./coachShared.js";

const checkRateLimit = makeRateLimiter();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Příliš mnoho dotazů. Počkej minutu a zkus znovu." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array required" });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    return res.status(200).json({ text });
  } catch (error) {
    console.error("Coach API error:", error);
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "Příliš mnoho dotazů. Zkus to za chvíli." });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return res.status(401).json({ error: "Chybný API klíč." });
    }
    return res.status(500).json({ error: "Něco se pokazilo. Zkus to znovu." });
  }
}
