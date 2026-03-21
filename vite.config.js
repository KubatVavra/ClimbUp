import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function localApiPlugin() {
  const rateMap = new Map();
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/coach', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        const ip = req.socket?.remoteAddress || 'local';
        const now = Date.now();
        const entry = rateMap.get(ip);
        if (entry && now - entry.start < 60000 && entry.count >= 10) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Příliš mnoho dotazů. Počkej minutu.' }));
          return;
        }
        if (!entry || now - entry.start >= 60000) rateMap.set(ip, { start: now, count: 1 });
        else entry.count++;
        let body = '';
        for await (const chunk of req) body += chunk;
        try {
          const { messages } = JSON.parse(body);
          const { default: Anthropic } = await import('@anthropic-ai/sdk');

          const SYSTEM_PROMPT = `Jsi LEVELUP Coach. Analyzuješ denní jídelníček uživatele. Piš česky, stručně, max 3 odstavce. Přátelský ale přímý — žádné mlžení. Začni emoji: ✅ (dobrý den), ⚠️ (je co zlepšit), 🔴 (špatný den).
Vždy analyzuj:
1. Kvalita jídla — zpracované vs kvalitní potraviny, pestrost, vláknina, zelenina. Buď konkrétní.
2. Hydratace — pod 2l = upozornit. Chybí data = zeptat se.
3. Přesně 3 tipy na zítra — konkrétní a akční, odvozené z dat dne. Ne generic rady.
Pravidla: Nevymýšlej data. Chybí údaje = zeptej se. Žádné suplementy. Pouze výživa. Na cokoliv jiného: 'Tohle není můj obor. Jsem tu od jídla 💪'`;

          const client = new Anthropic();
          const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages,
          });
          const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ text }));
        } catch (err) {
          console.error('Coach API error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Server error' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
})
