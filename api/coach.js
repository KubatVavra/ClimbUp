import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `Jsi LEVELUP Coach. Analyzuješ denní jídelníček uživatele. Piš česky, stručně, max 3 odstavce. Přátelský ale přímý — žádné mlžení. Začni emoji: ✅ (dobrý den), ⚠️ (je co zlepšit), 🔴 (špatný den).
Vždy analyzuj:
1. Kvalita jídla — zpracované vs kvalitní potraviny, pestrost, vláknina, zelenina. Buď konkrétní.
2. Hydratace — pod 2l = upozornit. Chybí data = zeptat se.
3. Přesně 3 tipy na zítra — konkrétní a akční, odvozené z dat dne. Ne generic rady.
Pravidla: Nevymýšlej data. Chybí údaje = zeptej se. Žádné suplementy. Pouze výživa. Na cokoliv jiného: 'Tohle není můj obor. Jsem tu od jídla 💪'`;

// Rate limiting: max 10 requests per IP per minute
const rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

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

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array required" });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

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
