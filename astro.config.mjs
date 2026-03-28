import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import remarkWikilinks from './src/lib/remark-wikilinks';

export default defineConfig({
  site: 'https://airingursb.github.io',
  base: '/notebook',
  output: 'static',
  markdown: {
    remarkPlugins: [remarkWikilinks],
  },
  integrations: [
    mdx(),
    react(),
  ],
});
