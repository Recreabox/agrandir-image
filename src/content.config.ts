import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const outils = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/outils' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    h1: z.string(),
    lede: z.string(),
    navLabel: z.string(),
    order: z.number(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    readingMinutes: z.number(),
    author: z.string(),
    tool: z.string(),
    cta: z.object({ text: z.string(), href: z.string(), label: z.string() }),
  }),
});

export const collections = { outils, blog };
