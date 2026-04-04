import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_UGE24azV.mjs';
import { manifest } from './manifest_DMp2OWIL.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/api/keystatic/_---params_.astro.mjs');
const _page4 = () => import('./pages/archives.astro.mjs');
const _page5 = () => import('./pages/constitution.astro.mjs');
const _page6 = () => import('./pages/events.astro.mjs');
const _page7 = () => import('./pages/jams/2025-arcjam.astro.mjs');
const _page8 = () => import('./pages/jobs.astro.mjs');
const _page9 = () => import('./pages/keystatic/_---params_.astro.mjs');
const _page10 = () => import('./pages/og.png.astro.mjs');
const _page11 = () => import('./pages/posts/_---slug_/index.png.astro.mjs');
const _page12 = () => import('./pages/posts/_---page_.astro.mjs');
const _page13 = () => import('./pages/posts/_---slug_.astro.mjs');
const _page14 = () => import('./pages/robots.txt.astro.mjs');
const _page15 = () => import('./pages/rss.xml.astro.mjs');
const _page16 = () => import('./pages/search.astro.mjs');
const _page17 = () => import('./pages/tags/_tag_/_---page_.astro.mjs');
const _page18 = () => import('./pages/tags.astro.mjs');
const _page19 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.16.6_@types+node@25_12311a9b0791a31eaef1ab72787e0c90/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.md", _page2],
    ["node_modules/.pnpm/@keystatic+astro@5.0.6_@key_cf5f2fc05eecbe4891d56bb1a5f46da5/node_modules/@keystatic/astro/internal/keystatic-api.js", _page3],
    ["src/pages/archives/index.astro", _page4],
    ["src/pages/constitution.md", _page5],
    ["src/pages/events.md", _page6],
    ["src/pages/jams/2025-arcjam.mdx", _page7],
    ["src/pages/jobs.md", _page8],
    ["node_modules/.pnpm/@keystatic+astro@5.0.6_@key_cf5f2fc05eecbe4891d56bb1a5f46da5/node_modules/@keystatic/astro/internal/keystatic-astro-page.astro", _page9],
    ["src/pages/og.png.ts", _page10],
    ["src/pages/posts/[...slug]/index.png.ts", _page11],
    ["src/pages/posts/[...page].astro", _page12],
    ["src/pages/posts/[...slug]/index.astro", _page13],
    ["src/pages/robots.txt.ts", _page14],
    ["src/pages/rss.xml.ts", _page15],
    ["src/pages/search.astro", _page16],
    ["src/pages/tags/[tag]/[...page].astro", _page17],
    ["src/pages/tags/index.astro", _page18],
    ["src/pages/index.astro", _page19]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "4c8507b8-f310-454e-a0e7-76e750f55f76",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
