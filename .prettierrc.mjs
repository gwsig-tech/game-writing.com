/** @type {import("prettier").Config} */
export default {
  arrowParens: "avoid",
  semi: true,
  tabWidth: 2,
  // Match upstream AstroPaper (printWidth 80) so hand-ported files diff cleanly
  // and code wraps predictably — that keeps edit diffs small and readable.
  // The "never reflow Markdown" rule is handled entirely by proseWrap: "preserve"
  // below (independent of printWidth); do NOT raise printWidth to fight prose
  // wrapping — that only collapses code onto unreadable single lines.
  printWidth: 80,
  proseWrap: "preserve",
  singleQuote: false,
  jsxSingleQuote: false,
  trailingComma: "es5",
  bracketSpacing: true,
  endOfLine: "lf",
  plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/styles/global.css",
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
    // Sveltia CMS writes frontmatter with its own YAML serializer, which
    // single-quotes the values YAML requires to be quoted (e.g. a title
    // containing a colon). The repo default above would rewrite those to double
    // quotes, so every CMS-authored post with such a title failed
    // `pnpm format:check` until someone reformatted it by hand. We match Sveltia
    // here rather than forcing Sveltia to match Prettier: its only quote setting
    // is document-wide, so making it emit double quotes would also quote
    // `pubDatetime` and break the `z.date()` content schema.
    //
    // Scoped to the three CMS collections in public/admin/config.yml. The
    // upstream reference posts (examples/, _releases/, _color-schemes/) are
    // excluded on purpose so they keep diffing cleanly against AstroPaper.
    {
      files: [
        "src/content/posts/*.{md,mdx}",
        "src/content/posts/_events/*.{md,mdx}",
        "src/content/posts/_spotlights/*.{md,mdx}",
      ],
      options: {
        singleQuote: true,
      },
    },
  ],
};
