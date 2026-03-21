import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { SYSTEM_PROMPT, makeRateLimiter } from './api/coachShared.js';

function localApiPlugin() {
  const checkRateLimit = makeRateLimiter();
  let client = null; // lazy-initialised on first request, reused after

  const json = (res, status, body) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  };

  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/coach', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

        const ip = req.socket?.remoteAddress || 'local';
        if (!checkRateLimit(ip)) return json(res, 429, { error: 'Příliš mnoho dotazů. Počkej minutu.' });

        let body = '';
        for await (const chunk of req) body += chunk;

        try {
          const { messages } = JSON.parse(body);
          if (!client) {
            const { default: Anthropic } = await import('@anthropic-ai/sdk');
            client = new Anthropic();
          }
          const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages,
          });
          const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
          json(res, 200, { text });
        } catch (err) {
          console.error('Coach API error:', err);
          json(res, 500, { error: err.message || 'Server error' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
});
