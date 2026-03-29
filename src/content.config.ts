import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tags: z.array(z.string()),
    public: z.boolean().default(true),
    draft: z.boolean().default(false),
    interactive: z.boolean().default(false),
    summary: z.string(),
  }),
});

export const collections = { notes };
