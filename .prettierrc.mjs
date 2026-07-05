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
  ],
};
