#!/usr/bin/env node
/**
 * Full-page screenshots of every route and state in docs/research/SCREEN_INVENTORY.md, at 1440 and
 * 390 px, with a first-visit and a returning-user progress seed. Used for the F6 before/after sheet.
 * Usage: node scripts/design/capture-screens.mjs <outDir> [nameFilterRegex]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { startServer } from '../serve.mjs';

const out = process.argv[2];
const filter = process.argv[3] ? new RegExp(process.argv[3]) : null;
await mkdir(out, { recursive: true });
const PORT = 5211;
const BASE = `http://localhost:${PORT}/`;
const server = await startServer(PORT);
const browser = await chromium.launch();

const day = (offset) => { const d = new Date(); d.setDate(d.getDate() - offset); return d.toISOString().slice(0, 10); };
const returning = {
  version: 1,
  problems: {
    'pair-sum-target': { status: 'solved', submissions: 2, accepted: 1, revealed: false },
    'isomorphic-strings': { status: 'solved', submissions: 1, accepted: 1, revealed: false },
    'doubled-array': { status: 'solved', submissions: 3, accepted: 1, revealed: true },
    'ticket-queue': { status: 'attempted', submissions: 2, accepted: 0, revealed: false },
    'reverse-list': { status: 'solved', submissions: 1, accepted: 1, revealed: false },
    'top-k-frequent': { status: 'attempted', submissions: 3, accepted: 0, revealed: false },
    'level-order': { status: 'solved', submissions: 1, accepted: 1, revealed: false },
    'min-stack': { status: 'solved', submissions: 2, accepted: 1, revealed: false },
  },
  activeDays: [day(0), day(1), day(2), day(4), day(5), day(9), day(12)],
  totals: { submissions: 15, accepted: 6 },
  drafts: {},
};

const scenarios = [
  { name: 'dashboard-first-visit', hash: '#/' },
  { name: 'dashboard-returning', hash: '#/', state: returning },
  { name: 'map', hash: '#/map', state: returning },
  { name: 'daily', hash: '#/daily', state: returning },
  { name: 'palette', hash: '#/', state: returning, full: false, palette: 'gra' },
  { name: 'path-returning', hash: '#/path', state: returning },
  { name: 'path-first-visit', hash: '#/path' },
  { name: 'companies', hash: '#/companies', state: returning },
  { name: 'company-google', hash: '#/companies/google', state: returning },
  { name: 'company-wix', hash: '#/companies/wix', state: returning },
  { name: 'modes', hash: '#/modes' },
  { name: 'interview-setup', hash: '#/interview' },
  { name: 'battle-setup', hash: '#/battle' },
  { name: 'workspace-before-run', hash: '#/problem/pair-sum-target', wait: '.monaco-editor, textarea', full: false },
  { name: 'workspace-wrong-answer', hash: '#/problem/pair-sum-target', wait: '.monaco-editor', full: false, run: true },
  { name: 'not-found', hash: '#/nope' },
  { name: 'problem-not-found', hash: '#/problem/does-not-exist' },
  { name: 'privacy', url: 'privacy.html' },
];

for (const vp of [{ w: 1440, h: 900, tag: '1440' }, { w: 390, h: 844, tag: '390', mobile: true }]) {
  for (const s of scenarios) {
    if (filter && !filter.test(s.name)) continue;
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, hasTouch: !!vp.mobile, isMobile: !!vp.mobile });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    page.on('pageerror', (e) => errs.push(e.message));
    await page.addInitScript((st) => {
      window.LFB_REMOTE_RUNNER_URL = ''; window.LFB_SUPABASE_URL = ''; window.LFB_SUPABASE_ANON_KEY = '';
      // Guided tours open on a first visit; they would cover the screen being captured.
      localStorage.setItem('lfb:tours:v1', JSON.stringify({ site: '2026-01-01', interview: '2026-01-01', battle: '2026-01-01', mentor: '2026-01-01' }));
      if (st && !sessionStorage.getItem('seeded')) { localStorage.setItem('lfb:progress:v1', JSON.stringify(st)); sessionStorage.setItem('seeded', '1'); }
    }, s.state ?? null);
    try {
      await page.goto(s.url ? BASE + s.url : BASE + s.hash, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      if (s.wait) await page.waitForSelector(s.wait, { timeout: 20000 }).catch(() => {});
      if (s.palette) {
        await page.keyboard.press('Control+k');
        await page.waitForSelector('dialog.palette[open]');
        await page.keyboard.type(s.palette);
        await page.waitForTimeout(400);
      }
      if (s.run) {
        await page.click('button[data-action="run"]').catch(() => {});
        await page.waitForTimeout(2500);
      }
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}/${vp.tag}-${s.name}.png`, fullPage: s.full !== false, clip: undefined });
      console.log('shot', vp.tag, s.name, errs.length ? 'ERRORS: ' + errs.join(' | ') : '');
    } catch (e) {
      console.log('FAIL', vp.tag, s.name, e.message.split('\n')[0]);
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
