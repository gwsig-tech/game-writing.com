import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const BLOG_PATH = "src/data/blog";
export const JOBS_PATH = "src/data/jobs";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
    }),
});

const jobs = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${JOBS_PATH}` }),
  schema: () =>
    z.object({
      title: z.string(),
      company: z.string(),
      companyUrl: z.string().url().optional(),
      location: z.string(),
      locationUrl: z.string().url().optional(),
      game: z.string().optional(),
      years: z.string().optional(),
      tags: z.array(z.string()).default([]),
      url: z.string().url().optional(),
      draft: z.boolean().optional(),
    }),
});

export const collections = { blog, jobs };
