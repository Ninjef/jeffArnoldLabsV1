import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://jeffarnoldlabs.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
    assets: '_astro',
  },
  integrations: [
    mdx(),
    react(),
    tailwind({ applyBaseStyles: true }),
    sitemap(),
  ],
});
