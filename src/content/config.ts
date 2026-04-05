import { defineCollection, z } from "astro:content";

// 1. Define the Job collection
const jobs = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    category: z.string(),
    workType: z.string(),
    experience: z.string(),
    datePosted: z.string(),
    applyLink: z.string().url(),
    description: z.string(), // This is the teaser for the card
  }),
});

// 2. Export them together
export const collections = {
  blog: defineCollection({ /* your existing blog code is here */ }),
  jobs: jobs, // Add this line
};