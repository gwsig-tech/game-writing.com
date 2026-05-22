import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const BLOG_PATH = "src/data/blog";
export const JOBS_PATH = "src/data/jobs";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
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
  schema: z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    category: z.string(),
    workType: z.string(),
    experience: z.string(),
    datePosted: z.string(),
    applyLink: z.string().url(),
    description: z.string(),
  }),
});

export const collections = { blog, jobs };
