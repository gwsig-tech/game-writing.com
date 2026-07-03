import { getRelativeLocaleUrl } from "astro:i18n";
import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";
import config from "@/config";

function getPostPathSegments(filePath: string | undefined): string[] {
  return (
    filePath
      ?.replace(BLOG_PATH, "")
      .split("/")
      .filter(path => path !== "") // remove empty string in the segments ["", "other-path"] <- empty string will be removed
      .filter(path => !path.startsWith("_")) // exclude directories start with underscore "_"
      .slice(0, -1) // remove the last segment_ file name_ since it's unnecessary
      .map(segment => slugifyStr(segment)) ?? [] // slugify each segment path
  );
}

function getIdSlug(id: string): string {
  // Making sure `id` does not contain the directory
  const postId = id.split("/");
  return postId.length > 0 ? String(postId[postId.length - 1]) : id;
}

function getPostSlugPath(id: string, filePath: string | undefined): string {
  const pathSegments = getPostPathSegments(filePath);
  const slug = getIdSlug(id);
  return pathSegments.length > 0
    ? [...pathSegments, slug].join("/")
    : String(slug);
}

/**
 * Returns the slug-only path for use as a route param in `getStaticPaths`.
 * No base prefix, no locale — Astro handles those at a higher level.
 * e.g. `/examples/my-post`
 */
export function getPostSlug(
  id: string,
  filePath: string | undefined
): string {
  return `/${getPostSlugPath(id, filePath)}`;
}

/**
 * Returns a fully navigable URL for use in `<a href>` and RSS links.
 * Applies locale routing via `getRelativeLocaleUrl`.
 * e.g. `/posts/my-post`
 */
export function getPostUrl(
  id: string,
  filePath: string | undefined,
  locale: string | undefined = config.site.lang
): string {
  return getRelativeLocaleUrl(
    locale,
    `posts/${getPostSlugPath(id, filePath)}`
  );
}
