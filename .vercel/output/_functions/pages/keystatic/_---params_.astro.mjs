import { c as createComponent, r as renderComponent, a as renderTemplate } from '../../chunks/astro/server_zgPa_4a1.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const $$KeystaticAstroPage = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Keystatic", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "C:/Users/jishe/Desktop/IGDA/game-writing.com/node_modules/.pnpm/@keystatic+astro@5.0.6_@key_cf5f2fc05eecbe4891d56bb1a5f46da5/node_modules/@keystatic/astro/internal/keystatic-page.js", "client:component-export": "Keystatic" })}`;
}, "C:/Users/jishe/Desktop/IGDA/game-writing.com/node_modules/.pnpm/@keystatic+astro@5.0.6_@key_cf5f2fc05eecbe4891d56bb1a5f46da5/node_modules/@keystatic/astro/internal/keystatic-astro-page.astro", void 0);

const $$file = "C:/Users/jishe/Desktop/IGDA/game-writing.com/node_modules/.pnpm/@keystatic+astro@5.0.6_@key_cf5f2fc05eecbe4891d56bb1a5f46da5/node_modules/@keystatic/astro/internal/keystatic-astro-page.astro";
const $$url = undefined;

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$KeystaticAstroPage,
	file: $$file,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
