import sharp from "sharp";
import { type CollectionEntry } from "astro:content";
import postOgImage from "./og-templates/post";
import siteOgImage from "./og-templates/site";

function svgToPngBuffer(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function generateOgImageForPost(post: CollectionEntry<"posts">) {
  const svg = await postOgImage(post);
  return svgToPngBuffer(svg);
}

export async function generateOgImageForSite() {
  const svg = await siteOgImage();
  return svgToPngBuffer(svg);
}
