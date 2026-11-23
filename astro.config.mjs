import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  site: 'https://agrandir-image.fr',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [svelte(), sitemap({ filter: (page) => !page.includes('/404') && !page.includes('/test-moteur') })],
  devToolbar: { enabled: false },
  vite: {
    worker: { format: 'es' },
    server: { headers: isolationHeaders },
    preview: { headers: isolationHeaders },
  },
});
