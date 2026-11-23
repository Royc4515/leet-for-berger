#!/usr/bin/env node
/**
 * Renders src/brand/social-preview.png (1200 x 630, the og:image): the brand and a slice of the
 * real Problem Map, drawn from the same pure layout the site uses (src/js/data/map-layout.js), with
 * an illustrative set of lit hexes. Regenerate after a design token or layout change.
 *
 * Usage: node scripts/design/social-preview.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TOPICS } from '../../src/js/data/taxonomy.js';
import { topicStates, layoutMap } from '../../src/js/data/map-layout.js';
import { availableEntries } from '../../src/js/problems/index.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const placed = JSON.parse(readFileSync(`${ROOT}src/js/data/problem-topics.json`, 'utf8'));
const ids = availableEntries().map((e) => e.id);
// Light the first few problems of the first tiers, so the preview shows the lit-hex idea.
const progress = {};
for (const t of TOPICS.filter((x) => x.tier <= 1)) {
  ids.filter((id) => placed[id]?.topic === t.id).slice(0, t.tier === 0 ? 6 : 2).forEach((id) => (progress[id] = { status: 'solved', submissions: 1, accepted: 1 }));
}
const states = topicStates({ topics: TOPICS, placed, ids, progress });
const L = layoutMap(states, { width: 1100 });
const hex = (cx, cy, r) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
const roads = L.roads.map((r) => `<path d="M${r.points[0].x},${r.points[0].y} C${r.points[1].x},${r.points[1].y} ${r.points[2].x},${r.points[2].y} ${r.points[3].x},${r.points[3].y}" fill="none" stroke="${states.get(r.to).state === 'locked' ? '#3d3831' : '#7d7261'}" stroke-width="1.6" ${states.get(r.to).state === 'locked' ? 'stroke-dasharray="2 5"' : ''}/>`).join('');
const districts = L.districts
  .map((d) => {
    const st = states.get(d.id);
    const cells = st.problems.map((pid, j) => `<polygon points="${hex(d.x + d.cells[j].x, d.y + d.cells[j].y, L.r - 1.1)}" fill="${progress[pid] ? '#f3a93c' : st.state === 'locked' ? '#1f1d19' : '#2d2a24'}"/>`).join('');
    return `<rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}" rx="12" fill="${st.state === 'locked' ? '#171512' : '#1e1c18'}" stroke="#3d3831" ${st.state === 'locked' ? 'stroke-dasharray="3 4"' : ''}/><text x="${d.x + 12}" y="${d.y + 19}" fill="${st.state === 'locked' ? '#a1988a' : '#f2ece2'}" font-family="Bricolage Grotesque" font-weight="650" font-size="13">${st.title.replace('&', '&amp;')}</text>${cells}`;
  })
  .join('');

// setContent pages cannot fetch file:// fonts, so the self-hosted faces are inlined.
const font = (f) => `data:font/woff2;base64,${readFileSync(`${ROOT}src/fonts/${f}`).toString('base64')}`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Bricolage Grotesque'; src: url('${font('bricolage-grotesque-latin.woff2')}') format('woff2'); font-weight: 200 800; }
@font-face { font-family: 'Inter'; src: url('${font('inter-latin.woff2')}') format('woff2'); font-weight: 400 700; }
html, body { margin: 0; width: 1200px; height: 630px; background: #100f0d; overflow: hidden; }
.wrap { position: relative; width: 1200px; height: 630px; }
.map { position: absolute; left: 560px; top: 46px; transform: scale(0.86); transform-origin: top left; opacity: 0.95; }
.fade { position: absolute; inset: 0; background: linear-gradient(90deg, #100f0d 44%, rgba(16,15,13,0.55) 60%, rgba(16,15,13,0) 78%); }
.copy { position: absolute; left: 72px; top: 150px; width: 520px; color: #f2ece2; font-family: Inter, sans-serif; }
.brand { display: flex; align-items: center; gap: 16px; font: 700 34px 'Bricolage Grotesque'; letter-spacing: -0.02em; }
.brand b { font-weight: 700; } .brand span { color: #a1988a; font-weight: 500; }
h1 { font: 700 60px/1.02 'Bricolage Grotesque'; letter-spacing: -0.03em; margin: 34px 0 18px; }
h1 em { font-style: normal; color: #f3a93c; }
p { font-size: 24px; line-height: 1.4; color: #cbc2b5; margin: 0; }
</style></head><body><div class="wrap">
<svg class="map" width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}">${roads}${districts}</svg>
<div class="fade"></div>
<div class="copy"><div class="brand"><svg width="48" height="48" viewBox="0 0 24 24"><path d="M12 1.5 21.1 6.75v10.5L12 22.5 2.9 17.25V6.75Z" fill="#f3a93c"/><path d="M12 6.2 16.5 8.8v5.2L12 16.6 7.5 14V8.8Z" fill="#100f0d"/><path d="M12 9.3 13.8 10.35v2.1L12 13.5l-1.8-1.05v-2.1Z" fill="#f3a93c"/></svg><b>Leet<span>-For-</span>Berger</b></div>
<h1>Interview practice on a <em>map</em>.</h1><p>${ids.length} problems in 26 topics. Every problem is a hex; every solve lights one up.</p></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${ROOT}src/brand/social-preview.png` });
await browser.close();
console.log('src/brand/social-preview.png');
