import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

async function loadFont(weight: 400 | 700): Promise<Buffer> {
  const url = import.meta.resolve(
    `@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${weight}-normal.woff`
  );
  return readFile(fileURLToPath(url));
}

/**
 * Self-hosted IBM Plex Mono (400/700), read from disk at build time.
 * Avoids a live fonts.googleapis.com fetch, which previously made the
 * (dormant) OG image build depend on external network access.
 */
export default async function loadFonts(): Promise<
  Array<{ name: string; data: Buffer; weight: number; style: string }>
> {
  const [regular, bold] = await Promise.all([loadFont(400), loadFont(700)]);

  return [
    { name: "IBM Plex Mono", data: regular, weight: 400, style: "normal" },
    { name: "IBM Plex Mono", data: bold, weight: 700, style: "bold" },
  ];
}
