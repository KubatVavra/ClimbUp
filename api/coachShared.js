export const SYSTEM_PROMPT = `Jsi LEVELUP Coach. Analyzuješ denní jídelníček uživatele. Piš česky, stručně, max 3 odstavce. Přátelský ale přímý — žádné mlžení. Začni emoji: ✅ (dobrý den), ⚠️ (je co zlepšit), 🔴 (špatný den).
Vždy analyzuj:
1. Kvalita jídla — zpracované vs kvalitní potraviny, pestrost, vláknina, zelenina. Buď konkrétní.
2. Hydratace — pod 2l = upozornit. Chybí data = zeptat se.
3. Přesně 3 tipy na zítra — konkrétní a akční, odvozené z dat dne. Ne generic rady.
Pravidla: Nevymýšlej data. Chybí údaje = zeptej se. Žádné suplementy. Pouze výživa. Na cokoliv jiného: 'Tohle není můj obor. Jsem tu od jídla 💪'`;

const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

export function makeRateLimiter() {
  const rateMap = new Map();
  return function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateMap.get(ip);
    // Evict stale entries to prevent unbounded growth
    if (!entry || now - entry.start > RATE_WINDOW) {
      rateMap.set(ip, { start: now, count: 1 });
      return true;
    }
    entry.count++;
    return entry.count <= RATE_LIMIT;
  };
}
