#!/usr/bin/env node
/**
 * Problem Map performance probe (ADR 0010): load time, SVG size, long tasks and frame times during a
 * pointer sweep and keyboard selection, at 1440 px and at 390 px with 4x CPU throttling.
 * Usage: node scripts/design/perf-map.mjs
 */
import { chromium } from 'playwright';
import { startServer } from '../serve.mjs';
const server = await startServer(5233);
const b = await chromium.launch();
for (const [label, rate, vp] of [['desktop 1x', 1, { width: 1440, height: 900 }], ['phone 4x CPU', 4, { width: 390, height: 844 }], ['desktop 4x CPU', 4, { width: 1440, height: 900 }]]) {
  const ctx = await b.newContext({ viewport: vp });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await p.addInitScript(() => {
    window.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.duration))).observe({ type: 'longtask', buffered: true });
    localStorage.setItem('lfb:progress:v1', JSON.stringify({ version: 1, problems: { 'pair-sum-target': { status: 'solved', submissions: 1, accepted: 1 }, 'isomorphic-strings': { status: 'solved', submissions: 1, accepted: 1 } }, activeDays: [], totals: { submissions: 2, accepted: 2 }, drafts: {} }));
  });
  await p.goto('http://localhost:5233/#/map');
  await p.waitForFunction(() => document.querySelectorAll('.district').length === 26, null, { timeout: 30000 });
  const t = await p.evaluate(() => ({ ready: Math.round(performance.now()), hexes: document.querySelectorAll('.hx').length, nodes: document.querySelectorAll('.map-svg *').length, longestLoad: Math.round(Math.max(0, ...window.__long)) }));
  await p.evaluate(() => { window.__long = []; window.__frames = []; let last = performance.now(); const f = (now) => { window.__frames.push(now - last); last = now; window.__raf = requestAnimationFrame(f); }; window.__raf = requestAnimationFrame(f); });
  const box = await p.locator('.map-canvas').boundingBox();
  for (let i = 0; i < 120; i++) await p.mouse.move(box.x + (box.width * (i % 60)) / 60, box.y + box.height * (0.2 + 0.6 * ((i * 7) % 60) / 60));
  // select a few districts with the keyboard
  await p.locator('.district[tabindex="0"]').focus();
  for (const k of ['ArrowRight', 'ArrowDown', 'Enter', 'ArrowRight', 'Enter', 'ArrowDown', 'Enter']) await p.keyboard.press(k);
  const m = await p.evaluate(() => { cancelAnimationFrame(window.__raf); const fr = window.__frames.slice(2); const sorted = [...fr].sort((a, b) => a - b); return { frames: fr.length, p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]), worst: Math.round(sorted.at(-1)), dropped: fr.filter((d) => d > 33.4).length, longest: Math.round(Math.max(0, ...window.__long)), longCount: window.__long.length }; });
  console.log(label, JSON.stringify({ ...t, interaction: m }));
  await ctx.close();
}
await b.close(); server.close();
