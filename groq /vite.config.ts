import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

function searchPlugin() {
  return {
    name: 'web-search-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/search', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
          const query = url.searchParams.get('q');
          if (!query) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: 'Query parameter q is required', results: [] }));
            return;
          }

          const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          const html = await ddgRes.text();
          const results: Array<{ title: string; url: string; snippet: string }> = [];
          const regex = /<h2[^>]*class="result__title"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
          let match;
          while ((match = regex.exec(html)) !== null && results.length < 5) {
            let rawUrl = match[1];
            let title = match[2].replace(/<[^>]+>/g, '').trim();
            let snippet = match[3].replace(/<[^>]+>/g, '').trim();
            let cleanUrl = rawUrl;
            const uddgMatch = rawUrl.match(/[?&]uddg=([^&]+)/);
            if (uddgMatch) {
              try { cleanUrl = decodeURIComponent(uddgMatch[1]); } catch(e){}
            }
            results.push({ title, url: cleanUrl, snippet });
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ query, results, count: results.length }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: err.message || 'Search failed', results: [] }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), searchPlugin()],
  server: {
    port: 5173,
    host: true,
  }
});
