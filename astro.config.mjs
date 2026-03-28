import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://airingursb.github.io',
  base: '/notebook',
  output: 'static',
  integrations: [
    mdx(),
    react(),
  ],
});
