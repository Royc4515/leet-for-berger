#!/usr/bin/env node
/**
 * Renders the app icons the web app manifest and iPhone's Home Screen use (ADR 0011): the logo hex
 * on the graphite ground, with a faint amber glow behind it. Regenerate after a logo change.
 *
 *   src/brand/icon-192.png, icon-512.png    manifest, purpose "any" (launchers round the corners)
 *   src/brand/icon-maskable-512.png         manifest, purpose "maskable": the hex inside the 80% safe circle
 *   src/brand/apple-touch-icon.png          180 x 180, iPhone and iPad Home Screen (iOS rounds it)
 *   src/brand/badge-96.png                  Android's status bar mark: white on transparent (only alpha counts)
 *
 * Usage: node scripts/design/app-icons.mjs
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
// The logo (src/brand/logo.svg) on a 24-unit grid: an amber hex, a graphite hole, an amber core.
const HEX = 'M12 1.5 21.1 6.75v10.5L12 22.5 2.9 17.25V6.75Z';
const HOLE = 'M12 6.2 16.5 8.8v5.2L12 16.6 7.5 14V8.8Z';
const CORE = 'M12 9.3 13.8 10.35v2.1L12 13.5l-1.8-1.05v-2.1Z';

/**
 * @param {number} size the icon's side in px
 * @param {number} logo the logo's height as a share of the side
 * @param {boolean} [mono] the white-on-transparent badge
 */
function svg(size, logo, mono = false) {
  const s = (size * logo) / 21; // the hex is 21 units tall
  const at = (size - 24 * s) / 2;
  const mark = mono
    ? `<path d="${HEX} ${HOLE}" fill="#fff" fill-rule="evenodd"/><path d="${CORE}" fill="#fff"/>`
    : `<path d="${HEX}" fill="#f3a93c"/><path d="${HOLE}" fill="#100f0d"/><path d="${CORE}" fill="#f3a93c"/>`;
  const ground = mono
    ? ''
    : `<defs><radialGradient id="g" cx="50%" cy="46%" r="50%"><stop offset="0" stop-color="#f3a93c" stop-opacity="0.22"/><stop offset="0.55" stop-color="#f3a93c" stop-opacity="0.05"/><stop offset="1" stop-color="#f3a93c" stop-opacity="0"/></radialGradient></defs>
       <rect width="${size}" height="${size}" fill="#100f0d"/><rect width="${size}" height="${size}" fill="url(#g)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${ground}<g transform="translate(${at} ${at}) scale(${s})">${mark}</g></svg>`;
}

const ICONS = [
  { file: 'icon-192.png', size: 192, logo: 0.62 },
  { file: 'icon-512.png', size: 512, logo: 0.62 },
  // Safe zone: a circle of 40% radius; the hex's corners sit on a circle of half its height.
  { file: 'icon-maskable-512.png', size: 512, logo: 0.5 },
  { file: 'apple-touch-icon.png', size: 180, logo: 0.6 },
  { file: 'badge-96.png', size: 96, logo: 0.86, mono: true },
];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, executablePath: process.env.PW_EXECUTABLE || undefined });
for (const icon of ICONS) {
  const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size } });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg(icon.size, icon.logo, icon.mono)}</body></html>`);
  await page.locator('svg').screenshot({ path: `${ROOT}src/brand/${icon.file}`, omitBackground: true });
  await page.close();
  console.log(`src/brand/${icon.file}`);
}
await browser.close();
