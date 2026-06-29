/** @type {import("prettier").Config} */
export default {
  arrowParens: "avoid",
  semi: true,
  tabWidth: 2,
  // Effectively disable width-based line wrapping: Prettier has no true "off"
  // switch, so a very large printWidth means it won't split lines just to fit a
  // column. Use editor word-wrap to read long lines. proseWrap stays "preserve"
  // so Markdown/MDX prose is never reflowed either.
  printWidth: 9999,
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
