#!/usr/bin/env node
/**
 * End-to-end smoke test (Playwright, Chromium).
 * Exercises the real browser paths unit tests cannot: Monaco, Web Workers, Pyodide,
 * resizers, routing, lockdown. Fails on ANY console error or uncaught page error.
 *
 * Usage: node e2e/smoke.mjs [--no-python] [--shots=dir]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { startServer } from '../scripts/serve.mjs';
import { startFakeRunner } from './fake-runner.mjs';
import { loadProblem } from '../src/js/problems/index.js';

const args = new Set(process.argv.slice(2));
const skipPython = args.has('--no-python');
const shotsDir = [...args].find((a) => a.startsWith('--shots='))?.split('=')[1];
const PORT = 5199;
const BASE = `http://localhost:${PORT}/`;

const server = await startServer(PORT);
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, executablePath: process.env.PW_EXECUTABLE || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
// src/js/config.js points at the live runner; the smoke test must not depend on it or spend its
// free quota, so the main page runs with the runner unset (editor-only), as a fork without one would.
// Same for accounts: the main page runs without the live Supabase project; a stubbed step covers sign-in.
await page.addInitScript(() => {
  window.LFB_REMOTE_RUNNER_URL = '';
  window.LFB_SUPABASE_URL = '';
  window.LFB_SUPABASE_ANON_KEY = '';
  // Longest main-thread task, read after the dashboard renders (ADR 0008: it used to be one 12 s task).
  window.__lfbLongestTask = 0;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__lfbLongestTask = Math.max(window.__lfbLongestTask, e.duration);
    }).observe({ type: 'longtask', buffered: true });
  } catch {
    // longtask is Chromium-only; the number is informational.
  }
});
// Problem modules load one at a time, when a problem opens (ADR 0008); count what the page fetched.
const PROBLEM_MODULE = /\/problems\/[^/]+\/problem\.js(\?|$)/;
const problemModules = [];
page.on('request', (r) => PROBLEM_MODULE.test(r.url()) && problemModules.push(r.url()));
const DASHBOARD_BUDGET_MS = 4000;
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(`console (during step ${step}): ${m.text()}`));
page.on('pageerror', (e) => errors.push(`pageerror (during step ${step}): ${e.message}${process.env.E2E_STACKS ? '\n' + e.stack : ''}`));
if (shotsDir) await mkdir(shotsDir, { recursive: true });
const shot = async (name) => {
  if (!shotsDir) return;
  await page.waitForTimeout(400); // let the entry animation finish so shots are not half-faded
  await page.screenshot({ path: `${shotsDir}/${name}.png` });
};

let step = 0;
async function check(name, fn) {
  step++;
  try {
    await fn();
    console.log(`ok ${step} - ${name}`);
  } catch (err) {
    console.log(`not ok ${step} - ${name}\n  ${err.message.split('\n')[0]}`);
    await shot(`FAIL-${step}`);
    throw err;
  }
}
const expectText = async (sel, re, timeout = 15000) => {
  await page.waitForFunction(([s, src]) => new RegExp(src).test(document.querySelector(s)?.textContent ?? ''), [sel, re.source], { timeout });
};
const expectDialog = (p, re) =>
  p.waitForFunction((src) => new RegExp(src).test(document.querySelector('dialog.modal')?.textContent ?? ''), re.source, { timeout: 5000 });
const setCode = (code) => page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code);
const revealSolution = async (p = page) => {
  const before = await p.evaluate(() => window.monaco.editor.getModels().map((m) => m.getValue()).join('\n'));
  await p.click('button[data-action="reveal"]');
  await p.click('dialog.modal button:has-text("Reveal")');
  await p.waitForFunction(
    (prev) => window.monaco.editor.getModels().map((m) => m.getValue()).join('\n') !== prev,
    before,
    { timeout: 15000 },
  );
};

try {
  await check('a fresh visit to #/ loads no workspace, runner program builder or supabase-js, and the dashboard renders', async () => {
    // Shipped auth config (live Supabase project) on purpose: that is the visitor who used to pay for supabase-js.
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fresh = await ctx.newPage();
    const urls = [];
    fresh.on('request', (r) => urls.push(r.url()));
    fresh.on('console', (m) => m.type() === 'error' && errors.push(`console (fresh page): ${m.text()}`));
    fresh.on('pageerror', (e) => errors.push(`pageerror (fresh page): ${e.message}`));
    await fresh.addInitScript(() => {
      window.LFB_REMOTE_RUNNER_URL = '';
    });
    await fresh.goto(`${BASE}#/`);
    await fresh.waitForSelector('.problem-table tbody tr a.problem-link');
    const ms = await fresh.evaluate(() => performance.now());
    await fresh.waitForTimeout(800);
    const bad = urls.filter((u) => /ui\/views\/workspace\.js|engine\/programs\/build\.js|supabase-js/.test(u));
    if (bad.length) throw new Error(`loaded on a fresh #/: ${bad.join(', ')}`);
    const fontFamilies = await fresh.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/['"]/g, ''));
    });
    if (!fontFamilies.includes('Inter') || !fontFamilies.includes('JetBrains Mono')) {
      throw new Error(`expected Inter and JetBrains Mono to be loaded, got: ${[...new Set(fontFamilies)].join(', ')}`);
    }
    const externalFonts = urls.filter((u) => /\.woff2(\?|$)/.test(u) && !u.startsWith(BASE));
    if (externalFonts.length) throw new Error(`external woff2 requests: ${externalFonts.join(', ')}`);
    const modules = urls.filter((u) => u.startsWith(BASE) && u.endsWith('.js')).length;
    console.log(`  # fresh #/: ${modules} local modules, ${urls.length} requests, dashboard ready in ${Math.round(ms)} ms`);
    await ctx.close();
  });

  await check('dashboard renders start block, filters, Clear filters empty state and problem bank, without loading any problem module', async () => {
    await page.goto(BASE);
    await page.waitForSelector('.problem-table tbody tr a.problem-link');
    await page.waitForSelector('.today-card .today-cta');
    const { ready, longest } = await page.evaluate(() => ({ ready: performance.now(), longest: window.__lfbLongestTask }));
    if (problemModules.length) throw new Error(`the dashboard fetched ${problemModules.length} problem modules, e.g. ${problemModules[0]}`);
    console.log(`  # dashboard ready in ${Math.round(ready)} ms (budget ${DASHBOARD_BUDGET_MS}), longest task ${Math.round(longest)} ms`);
    if (ready > DASHBOARD_BUDGET_MS) throw new Error(`dashboard took ${Math.round(ready)} ms, budget ${DASHBOARD_BUDGET_MS} ms`);
    await expectText('.stats-row.stats-empty', /Start with the learning path/);
    const primaries = await page.locator('#view .btn-primary').count();
    if (primaries !== 1) throw new Error(`expected 1 primary button on dashboard, got ${primaries}`);
    await shot('01-dashboard');

    // Topic disclosure, result count, empty state with Clear filters restoring the full list.
    const totalRows = await page.locator('.dashboard-table tbody tr').count();
    await page.click('.topic-toggle');
    await page.waitForSelector('#dashboard-topics:not([hidden])');
    if (await page.evaluate(() => document.querySelector('.topic-toggle').hasAttribute('aria-pressed'))) {
      throw new Error('topic toggle should be a disclosure only (no aria-pressed)');
    }
    await page.keyboard.press('Escape');
    await page.waitForSelector('#dashboard-topics', { state: 'hidden' });
    await page.click('.topic-toggle');
    await page.waitForSelector('#dashboard-topics:not([hidden])');
    await page.click('#dashboard-topics .chip:has-text("Graphs")');
    await expectText('.topic-toggle', /Topic: Graphs/);
    if (!(await page.evaluate(() => document.querySelector('.topic-toggle').classList.contains('is-active')))) {
      throw new Error('topic toggle missing .is-active when a topic is chosen');
    }
    const graphRows = await page.locator('.dashboard-table tbody tr').count();
    if (!(graphRows > 0 && graphRows < totalRows)) throw new Error(`Graphs filter did not narrow rows (${graphRows} vs ${totalRows})`);
    await page.focus('#dashboard-topics .chip:has-text("Graphs")');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#dashboard-topics', { state: 'hidden' });
    if ((await page.evaluate(() => document.activeElement?.classList.contains('topic-toggle'))) !== true) {
      throw new Error('Escape in topic panel did not return focus to topic toggle');
    }
    await page.fill('input.dashboard-search', 'zzzz-no-such-problem');
    await page.waitForSelector('.dashboard-empty:not([hidden]) .state');
    await expectText('.filter-count', /^0 of \d+ problems$/);
    await page.click('.dashboard-empty button:has-text("Clear filters")');
    await page.waitForSelector('.dashboard-table-wrap:not([hidden])');
    if (await page.evaluate(() => document.querySelector('.topic-toggle').classList.contains('is-active'))) {
      throw new Error('Clear filters did not remove .is-active from topic toggle');
    }
    const restoredRows = await page.locator('.dashboard-table tbody tr').count();
    if (restoredRows !== totalRows) throw new Error(`Clear filters restored ${restoredRows} rows, expected ${totalRows}`);
    if ((await page.evaluate(() => document.activeElement?.matches('input.dashboard-search'))) !== true) {
      throw new Error('Clear filters did not return focus to search input');
    }
  });

  await check('problem opens via full-row link with Monaco (vs-dark) and starter code, loading exactly its own module', async () => {
    // Click the Topics cell coordinates on the far right of the row to verify the stretched full-row link.
    const cellBox = await page.locator('tr.row-link:has(a.problem-link[href="#/problem/smallest-base-segment"]) td.cell-topics').boundingBox();
    await page.mouse.click(cellBox.x + cellBox.width / 2, cellBox.y + cellBox.height / 2);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    if (problemModules.length !== 1 || !problemModules[0].includes('/smallest-base-segment/')) throw new Error(`expected one problem module, fetched: ${problemModules.join(', ')}`);
    const theme = await page.evaluate(() => document.querySelector('.monaco-editor').classList.contains('vs-dark'));
    if (!theme) throw new Error('editor is not vs-dark');
    const code = await page.evaluate(() => window.monaco.editor.getModels()[0].getValue());
    if (!code.includes('function smallestBaseSegment')) throw new Error('starter code missing');
  });

  await check('Run on starter code: 15 cases, 5 detailed + 10 hidden, Wrong Answer', async () => {
    await page.click('button[data-action="run"]');
    await page.waitForSelector('.result-head');
    await expectText('.result-head', /Wrong Answer/);
    const tabs = await page.locator('.case-tab').count();
    const hidden = await page.locator('.hidden-pill').count();
    if (tabs !== 5 || hidden !== 10) throw new Error(`expected 5+10, got ${tabs}+${hidden}`);
    // Case tabs follow the ARIA tabs pattern, and each tab says its status in words, not colour alone.
    const caseTabs = await page.evaluate(() => {
      const list = document.querySelector('.case-tabs');
      const items = [...list.querySelectorAll('.case-tab')];
      const selected = items.find((t) => t.getAttribute('aria-selected') === 'true');
      const panel = document.getElementById(selected?.getAttribute('aria-controls'));
      return {
        role: list.getAttribute('role'),
        roles: items.every((t) => t.getAttribute('role') === 'tab'),
        tabbable: items.filter((t) => t.tabIndex === 0).length,
        words: items.every((t) => /, \S/.test(t.querySelector('.sr-only')?.textContent ?? '')),
        panel: panel?.getAttribute('role'),
        labelled: panel?.getAttribute('aria-labelledby') === selected?.id,
      };
    });
    if (caseTabs.role !== 'tablist' || !caseTabs.roles || caseTabs.tabbable !== 1 || !caseTabs.words || caseTabs.panel !== 'tabpanel' || !caseTabs.labelled) {
      throw new Error(`case tabs break the ARIA tabs pattern: ${JSON.stringify(caseTabs)}`);
    }
    await page.focus('.case-tab[aria-selected="true"]');
    const firstCase = await page.evaluate(() => document.activeElement.id);
    await page.keyboard.press('ArrowRight');
    const moved = await page.evaluate(() => ({ id: document.activeElement.id, selected: document.activeElement.getAttribute('aria-selected') }));
    if (moved.id === firstCase || moved.selected !== 'true') throw new Error(`ArrowRight did not move to the next case: ${JSON.stringify(moved)}`);
    await shot('02-wrong-answer');
  });

  await check('Reveal Solution (confirm dialog) then Submit is Accepted 15/15', async () => {
    await revealSolution();
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/);
    await expectText('.result-head', /15 \/ 15/);
    await shot('03-accepted');
  });

  await check('walkthrough unlocks after the solve; submission history lists the submit with its code', async () => {
    await page.click('details.walkthrough summary');
    await expectText('.walkthrough-body', /Reasoning, step by step/);
    await page.click('.walkthrough-body button:has-text("Show the verified solution")');
    await page.waitForSelector('.walkthrough-body pre.solution-code code');
    await page.click('details.history summary');
    await expectText('details.history summary', /Submissions \(\d+\)/);
    await expectText('.history-list li:first-child .history-verdict', /^Accepted$/);
    // A long solution line must scroll inside its box, never widen the description pane.
    const overflow = await page.evaluate(() => {
      const pane = document.querySelector('.pane-left');
      return pane.scrollWidth - pane.clientWidth;
    });
    if (overflow > 1) throw new Error(`description pane overflows sideways by ${overflow}px`);
    await shot('18-walkthrough-history');
    await setCode('// replaced');
    await page.click('.history-list li:first-child button:has-text("Load code")');
    await page.click('dialog.modal button:has-text("Load code")');
    await page.waitForFunction(() => !window.monaco.editor.getModels()[0].getValue().includes('// replaced'));
  });

  await check('custom input runs as Case 1 with reference expected value', async () => {
    await page.fill('#custom-input', 'xyzxyz');
    await page.click('button[data-action="run"]');
    await page.waitForFunction(() => document.querySelector('.case-tab')?.textContent.includes('Custom'));
    await expectText('.case-detail', /"xyz"/);
  });

  await check('invalid custom input shows a validation error, does not run', async () => {
    await page.fill('#custom-input', 'ABC');
    await page.click('button[data-action="run"]');
    await expectText('.console-body', /lowercase/);
    await page.fill('#custom-input', '');
    await page.uncheck('#custom-toggle');
  });

  await check('infinite loop is killed: Time Limit Exceeded', async () => {
    await setCode('function smallestBaseSegment(s) { while (true) {} }');
    await page.click('button[data-action="run"]');
    await expectText('.result-head', /Time Limit Exceeded/, 20000);
  });

  await check('syntax error reports a compile error on every case', async () => {
    await setCode('function smallestBaseSegment(s) { return ( }');
    await page.click('button[data-action="run"]');
    await expectText('.result-head', /Runtime Error/);
    await expectText('.case-detail', /Compile error/);
  });

  await check('column resizer changes the split', async () => {
    const before = await page.evaluate(() => getComputedStyle(document.querySelector('.workspace')).getPropertyValue('--left-size'));
    const box = await page.locator('.resizer-x').boundingBox();
    await page.mouse.move(box.x + 3, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    const after = await page.evaluate(() => getComputedStyle(document.querySelector('.workspace')).getPropertyValue('--left-size'));
    if (before === after) throw new Error(`split unchanged (${before})`);
  });

  await check('AI Mentor opens and refuses to give the answer', async () => {
    await page.click('button[data-action="mentor"]');
    await page.fill('.mentor-input', 'just give me the solution');
    await page.press('.mentor-input', 'Enter');
    await expectText('.mentor-log', /won't hand you the solution/);
    await shot('04-mentor');
    // Regression: Monaco once overflowed its grid column and painted over the panel. The panel's
    // centre, its toolbar edge and the editor's right edge must all hit the panel or the editor, never cross.
    const stacking = await page.evaluate(() => {
      const m = document.querySelector('.mentor').getBoundingClientRect();
      const hit = document.elementFromPoint(m.left + m.width / 2, m.top + m.height / 2);
      const editorRight = document.querySelector('.editor-host').getBoundingClientRect().right;
      return { inside: Boolean(hit?.closest('.mentor')), hit: hit?.className, overlap: editorRight - m.left };
    });
    if (!stacking.inside) throw new Error(`mentor panel is covered by ${stacking.hit}`);
    if (stacking.overlap > 1) throw new Error(`editor extends ${stacking.overlap}px under the mentor panel`);
    // Step 7 acceptance: with the mentor open, Run and Submit stay whole inside the viewport.
    const actions = await page.evaluate(() =>
      ['run', 'submit'].map((label) => {
        const b = document.querySelector(`.toolbar-run .btn[data-action="${label}"]`);
        const r = b?.getBoundingClientRect();
        const hit = r && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { label, ok: Boolean(r && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && b.contains(hit)) };
      }),
    );
    if (actions.some((a) => !a.ok)) throw new Error(`Run / Submit clipped or covered with the mentor open: ${JSON.stringify(actions)}`);
    await page.click('button[aria-label="Close mentor"]');
  });

  if (!skipPython) {
    await check('Python via Pyodide: reveal + submit is Accepted', async () => {
      await page.selectOption('.toolbar select', 'python');
      await revealSolution();
      await page.click('button:has-text("Submit")');
      await expectText('.result-head', /Accepted/, 90000);
      await page.selectOption('.toolbar select', 'javascript');
    });
  }

  // TypeScript is type-checked and transpiled by Monaco's TypeScript service, then runs as JavaScript.
  await check('TypeScript: reveal + submit is Accepted 15/15 on a function problem', async () => {
    await page.selectOption('.toolbar select', 'typescript');
    await revealSolution();
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 60000);
    await expectText('.result-head', /15 \/ 15/);
  });

  await check('TypeScript: a type error is a Compile Error with LeetCode-style diagnostics', async () => {
    await setCode('function smallestBaseSegment(s: string): string {\n  const n: number = s;\n  return s;\n}\n');
    await page.click('button[data-action="run"]');
    await expectText('.result-head', /Compile Error/, 30000);
    await expectText('.case-detail', /Line 2: Char 9: error TS2322: Type 'string' is not assignable to type 'number'/);
    await expectText('.case-detail', /type error is a Compile Error/);
    await shot('13-ts-compile-error');
    await page.selectOption('.toolbar select', 'javascript');
  });

  await check('Java is editor-only with an honest verdict', async () => {
    await page.selectOption('.toolbar select', 'java');
    await page.click('button[data-action="run"]');
    await expectText('.result-head', /Language Not Supported Yet/);
    await page.selectOption('.toolbar select', 'javascript');
  });

  await check('dashboard reflects the solve', async () => {
    await page.goto(`${BASE}#/`);
    await page.waitForSelector('.stat-value');
    if (await page.locator('.stats-row.stats-empty').count()) throw new Error('stats strip still in empty state after a solve');
    const solved = await page.locator('.stat-value').first().textContent();
    if (solved.trim() !== '1') throw new Error(`solved = ${solved}`);
    await expectText('tr:has(a.problem-link[href="#/problem/smallest-base-segment"]) .status-pill', /Assisted|Solved/);
  });

  // Remote runner (ADR 0005): with a runner URL configured, Java compiles on the server and is judged
  // in the page. A local fake stands in for the Worker (real javac when a JDK is installed).
  await check('remote runner: Java reveal + submit is Accepted through a runner endpoint', async () => {
    const problem = await loadProblem('pair-sum-target');
    const fake = await startFakeRunner(PORT + 100, { origin: `http://localhost:${PORT}`, reference: (a) => problem.solveReference(a) });
    // Its own context: the runner URL is read when the page loads, and progress stays separate.
    const remote = await browser.newPage({ viewport: { width: 1440, height: 900 } }).catch((err) => {
      fake.close();
      throw err;
    });
    remote.on('console', (m) => m.type() === 'error' && errors.push(`console (remote page, step ${step}): ${m.text()}`));
    remote.on('pageerror', (e) => errors.push(`pageerror (remote page, step ${step}): ${e.message}`));
    try {
      await remote.addInitScript((url) => {
        window.LFB_REMOTE_RUNNER_URL = url;
        window.LFB_SUPABASE_URL = '';
        window.LFB_SUPABASE_ANON_KEY = '';
      }, `http://localhost:${PORT + 100}`);
      await remote.goto(`${BASE}#/problem/pair-sum-target`);
      await remote.waitForSelector('.monaco-editor', { timeout: 30000 });
      const label = await remote.locator('.toolbar select option[value="java"]').textContent();
      if (/editor only/.test(label)) throw new Error(`Java still editor-only: ${label}`);
      await remote.selectOption('.toolbar select', 'java');
      if (!(await remote.locator('.runner-note').isVisible())) throw new Error('no "Runs on the server" note');
      await revealSolution(remote);
      await remote.click('button:has-text("Submit")');
      await remote.waitForFunction(() => /Accepted/.test(document.querySelector('.result-head')?.textContent ?? ''), null, { timeout: 60000 });
      await remote.waitForFunction(() => /15 \/ 15/.test(document.querySelector('.result-head')?.textContent ?? ''));
      const req = fake.requests[0];
      if (req.path !== '/v1/execute/java') throw new Error(`request path ${req.path}`);
      if (!req.body.files.some((f) => f.name === 'Harness.java')) throw new Error('Harness.java not sent');
      if (/expected/.test(JSON.stringify(req.body))) throw new Error('an expected value was sent');
      console.log(`  # ${fake.real ? 'compiled and ran with the local JDK' : 'no JDK here: answered with the reference solution'}; request ${req.encoding ?? 'identity'}`);
      if (fake.real) {
        await remote.evaluate(() => window.monaco.editor.getModels()[0].setValue('class Solution { int pairSum(int[] a) { return } }'));
        await remote.click('button[data-action="run"]');
        await remote.waitForFunction(() => /Compile error/.test(document.querySelector('.case-detail')?.textContent ?? ''), null, { timeout: 60000 });
      }
      if (shotsDir) await remote.screenshot({ path: `${shotsDir}/13-remote-java.png` });
    } finally {
      await remote.close();
      fake.close();
    }
  });

  // Linked lists, trees and design classes run through engine/adapters.js in the browser workers.
  await check('design problem (Min Stack): JS reveal + submit is Accepted through the adapter', async () => {
    await page.goto(`${BASE}#/problem/min-stack`);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('class MinStack')));
    await revealSolution();
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 30000);
    await expectText('.result-head', /15 \/ 15/);
  });

  await check('design problem (Min Stack): TypeScript reveal + submit is Accepted through the JavaScript adapter', async () => {
    await page.selectOption('.toolbar select', 'typescript');
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('class MinStack') && m.getValue().includes(': number')));
    await revealSolution();
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 60000);
    await expectText('.result-head', /15 \/ 15/);
    await page.selectOption('.toolbar select', 'javascript');
  });

  // RandomListNode (copy checked by node identity) and the randomized-set judge mode, in the browser.
  await check('random pointer copy (Random Link Copy): JS reveal + submit is Accepted', async () => {
    await page.goto(`${BASE}#/problem/random-link-copy`);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('function copyRandomList')));
    await revealSolution();
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 30000);
    await expectText('.result-head', /15 \/ 15/);
  });

  if (!skipPython) {
    // The special input types go through the Python adapter too; check each once in Pyodide.
    for (const id of ['list-loop', 'random-link-copy', 'nested-flatten']) {
      await check(`Python via Pyodide: ${id} (special input type) reveal + submit is Accepted`, async () => {
        await page.goto(`${BASE}#/problem/${id}`);
        await page.waitForSelector('.monaco-editor', { timeout: 30000 });
        await page.selectOption('.toolbar select', 'python');
        await revealSolution();
        await page.click('button:has-text("Submit")');
        await expectText('.result-head', /Accepted/, 90000);
        await page.selectOption('.toolbar select', 'javascript');
      });
    }
  }

  await check('random answers (Random Pool): JS reveal + submit is Accepted by the randomized-set judge', async () => {
    await page.goto(`${BASE}#/problem/random-pool`);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('class RandomizedSet')));
    await revealSolution();
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 30000);
    await expectText('.result-head', /15 \/ 15/);
  });

  // Growth estimate (ADR 0004): after an Accepted JS submit, the console adds one estimate line.
  await check('problem context: companies, complexity behind a toggle, family versions with links', async () => {
    await page.goto(`${BASE}#/problem/course-check`);
    // Collapsed under the tags by default so the statement comes first; the open state persists.
    await page.waitForSelector('details.about-problem .company-tag', { state: 'attached', timeout: 15000 });
    if (await page.locator('details.about-problem').evaluate((d) => d.open)) throw new Error('About this problem should start collapsed');
    await page.click('details.about-problem > summary');
    await page.waitForSelector('.problem-context .company-tag', { timeout: 15000 });
    await expectText('.problem-context .context-label', /Asked at \d+ compan/);
    if (!(await page.locator('.complexity-body').isHidden())) throw new Error('complexity should be hidden before a solve');
    await page.click('.problem-context button:has-text("Show")');
    await expectText('.complexity-body', /Best known for LeetCode \d+: O\(/);
    await expectText('.family-version.is-self', /This version/);
    await page.click('.family-list a.problem-link[href="#/problem/course-order"]');
    await page.waitForSelector('.family-version.is-self', { timeout: 15000 });
    await expectText('.problem-title', /Course Order/);
    await shot('14-problem-context');
  });

  await check('practice by company: search, Israeli filter, company page with practice links', async () => {
    await page.click('nav a[data-nav="companies"]');
    await page.waitForSelector('.company-card', { timeout: 15000 });
    await page.waitForSelector('.segmented[aria-label="Show companies"]');
    // Default is "Hiring in Israel": the first card is a major company. Cards are option cards:
    // monogram, name, "x of y solved" and a progress bar.
    await expectText('.segmented-btn[aria-pressed="true"]', /Hiring in Israel/);
    const firstCard = await page.evaluate(() => {
      const c = document.querySelector('.company-card');
      return { israel: c.dataset.israel, monogram: c.querySelector('.monogram')?.textContent, fact: c.querySelector('.company-card-sub')?.textContent, bar: Boolean(c.querySelector('.progress-bar')) };
    });
    if (firstCard.israel !== 'major' || !/^\S{1,2}$/.test(firstCard.monogram ?? '') || !/of \d+ solved|Nothing to practice/.test(firstCard.fact ?? '') || !firstCard.bar) {
      throw new Error(`unexpected first company card: ${JSON.stringify(firstCard)}`);
    }
    const hiringCount = await page.locator('.company-card').count();
    await shot('15a-companies-hiring');
    await page.click('.segmented-btn:has-text("Top in Israel")');
    const topCount = await page.locator('.company-card').count();
    if (!(topCount > 0 && topCount < hiringCount)) throw new Error(`"Top in Israel" should narrow the list (${topCount} vs ${hiringCount})`);
    await page.click('.segmented-btn:has-text("All")');
    const allCount = await page.locator('.company-card').count();
    if (!(allCount > hiringCount)) throw new Error(`"All" should show more cards than "Hiring in Israel" (${allCount} vs ${hiringCount})`);
    // Only under "All" does the Israel level tell cards apart, so only there is it a line on the card.
    await expectText('.company-card[data-israel="major"] .company-card-level', /Major in Israel/);
    await page.fill('input[aria-label="Search companies"]', 'wix');
    await page.waitForFunction(() => document.querySelectorAll('.company-card').length === 1);
    await shot('15-companies');
    await page.click('.company-card');
    await expectText('.page-head h1', /Wix/);
    await expectText('.page-head .page-sub', /can be practiced here/);
    // Filters are chips; "On the site only" is a toggle chip (off by default on a desktop).
    if ((await page.getAttribute('#on-site-only', 'aria-pressed')) !== 'false') throw new Error('on-site filter should start off at 1440px');
    await page.click('#on-site-only');
    if ((await page.getAttribute('#on-site-only', 'aria-pressed')) !== 'true') throw new Error('on-site chip did not toggle');
    const missing = await page.locator('.company-table tbody .tag-muted:has-text("Not on the site yet")').count();
    if (missing) throw new Error('on-site filter still shows problems that are not on the site');
    await page.click('.company-filters .chip:has-text("Easy")');
    const nonEasy = await page.locator('.company-table tbody tr:not(:has(.diff-easy))').count();
    if (nonEasy) throw new Error(`Easy filter left ${nonEasy} other rows`);
    await page.click('.company-filters .chip:has-text("All difficulties")');
    // Practice is a real link whose accessible name says which problem it opens.
    const practice = await page.evaluate(() =>
      [...document.querySelectorAll('.company-table tbody tr')].map((tr) => {
        const a = tr.querySelector('.practice-link');
        return { tag: a?.tagName, label: a?.getAttribute('aria-label') ?? '', title: tr.querySelector('.company-problem')?.textContent ?? '' };
      }),
    );
    const badPractice = practice.filter((p) => p.tag !== 'A' || !p.label.includes(p.title));
    if (!practice.length || badPractice.length) throw new Error(`Practice links without the problem in their name: ${JSON.stringify(badPractice.slice(0, 3))}`);
    await shot('16-company-wix');
    await page.click('.company-table tbody a.practice-link >> nth=0');
    await page.waitForSelector('.problem-context .company-tag', { state: 'attached', timeout: 15000 });
    await expectText('.problem-context', /Wix/);
  });

  const growthHeadline = async () => {
    await page.waitForFunction(() => document.querySelector('.growth-head')?.textContent.startsWith('Growth estimate:'), null, { timeout: 30000 });
    return page.locator('.growth-head').textContent();
  };
  await check('growth estimate: a linear Pair Sum Target gets a growth line and is not called slower', async () => {
    await page.goto(`${BASE}#/problem/pair-sum-target`);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('function pairSum')));
    await revealSolution();
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 30000);
    const text = await growthHeadline();
    console.log(`  # ${text}`);
    // Timing noise may make it inconclusive; an honest linear solution must never be flagged.
    if (!/target n\b/.test(text) || /slower than target/.test(text)) throw new Error(text);
    await shot('11-growth-linear');
  });

  await check('growth estimate: TypeScript Pair Sum Target is timed as its transpiled JavaScript', async () => {
    await page.selectOption('.toolbar select', 'typescript');
    await revealSolution();
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 60000);
    const text = await growthHeadline();
    console.log(`  # ${text}`);
    if (/unavailable|slower than target/.test(text)) throw new Error(text);
    await page.selectOption('.toolbar select', 'javascript');
  });

  // A timing estimate is statistical: a JIT tier change can leave one size uniformly slow and the
  // estimator then (honestly) says "too close to call". Same policy as the CI verifier
  // (tests/growth-solutions.test.js): up to 3 submits, at least one must say "slower than target",
  // and none may ever say "matches". The insert shifts elements in JavaScript (a native splice is a
  // memmove so fast that the quadratic term barely shows), and the solution is still Accepted.
  await check('growth estimate: an Accepted quadratic Median Stream (sorted array, shifting inserts) is slower than target', async () => {
    await page.goto(`${BASE}#/problem/median-stream`);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('class MedianFinder')));
    await setCode(`class MedianFinder {
  constructor() { this.a = []; }
  addNum(num) {
    let lo = 0, hi = this.a.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (this.a[mid] < num) lo = mid + 1; else hi = mid; }
    const a = this.a;
    a.push(num);
    for (let i = a.length - 1; i > lo; i--) a[i] = a[i - 1];
    a[lo] = num;
  }
  findMedian() { const a = this.a, m = a.length >> 1; return a.length % 2 ? 2 * a[m] : a[m - 1] + a[m]; }
}`);
    const seen = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.click('button:has-text("Submit")');
      // The previous attempt's verdict and estimate are still on screen until the console re-renders.
      await page.waitForSelector('.growth-head', { state: 'detached', timeout: 30000 });
      await expectText('.result-head', /Accepted/, 30000);
      const text = await growthHeadline();
      console.log(`  # ${text}`);
      seen.push(text);
      if (/: matches\./.test(text)) throw new Error(`a quadratic solution was called a match: ${text}`);
      if (/slower than target/.test(text)) break;
    }
    if (!seen.some((t) => /slower than target/.test(t))) throw new Error(seen.join(' | '));
    await shot('12-growth-quadratic');
  });

  if (!skipPython) {
    await check('growth estimate: Python Pair Sum Target gets an estimate through Pyodide', async () => {
      await page.goto(`${BASE}#/problem/pair-sum-target`);
      await page.waitForSelector('.monaco-editor', { timeout: 30000 });
      await page.selectOption('.toolbar select', 'python');
      await revealSolution();
      await page.click('button:has-text("Submit")');
      await expectText('.result-head', /Accepted/, 90000);
      const text = await growthHeadline();
      console.log(`  # ${text}`);
      if (/unavailable|slower than target/.test(text)) throw new Error(text);
      await page.selectOption('.toolbar select', 'javascript');
    });
  }

  if (!skipPython) {
    await check('linked list problem (Reverse List): Python reveal + submit is Accepted', async () => {
      await page.goto(`${BASE}#/problem/reverse-list`);
      await page.waitForSelector('.monaco-editor', { timeout: 30000 });
      await page.selectOption('.toolbar select', 'python');
      await revealSolution();
      await page.click('button:has-text("Submit")');
      await expectText('.result-head', /Accepted/, 90000);
      await page.selectOption('.toolbar select', 'javascript');
    });
  }

  // SQL problems run in sql.js (SQLite wasm) in a worker; SQL is the only language offered.
  await check('SQL problem: only SQL offered, write is rejected, reveal + submit is Accepted', async () => {
    await page.goto(`${BASE}#/problem/address-lookup`);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('-- Write your query here')));
    const options = await page.locator('.toolbar select option').evaluateAll((os) => os.map((o) => o.value));
    if (options.join() !== 'sql') throw new Error(`language options: ${options}`);
    await setCode('DELETE FROM Person RETURNING firstName, lastName, firstName AS city, lastName AS state');
    await page.click('button[data-action="run"]');
    await expectText('.result-head', /Runtime Error/, 60000);
    await expectText('.case-detail', /readonly/);
    // A runaway recursive CTE must cost one worker; the next run boots a fresh one.
    await setCode('WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r) SELECT n, n, n, n FROM r WHERE n < 0');
    await page.click('button[data-action="run"]');
    await expectText('.result-head', /Time Limit Exceeded/, 30000);
    await revealSolution();
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 60000);
    await expectText('.result-head', /15 \/ 15/);
    await shot('05-sql-accepted');
  });

  await check('learning path: 6 tiers, 131 problems, solved count and a Next up link', async () => {
    await page.click('a[data-nav="path"]');
    await page.waitForSelector('.path-tier');
    const tiers = await page.locator('.path-tier').count();
    if (tiers !== 6) throw new Error(`got ${tiers} tiers`);
    const problems = await page.locator('.path-problems li').count();
    if (problems !== 131) throw new Error(`got ${problems} path problems`);
    // Earlier steps solved problems on the path, so progress must be above zero.
    await expectText('.path-summary', /[1-9]\d* \/ 131 solved/);
    const next = await page.locator('.path-summary a.btn').getAttribute('href');
    // Step 9: a tier summary line each, topic disclosures with aria-expanded, a mini bar on every
    // topic header (visible while collapsed), full-row links, and the Next up row is in an open topic.
    const shape = await page.evaluate(() => {
      const toggles = [...document.querySelectorAll('.path-topic-toggle')];
      const collapsed = toggles.filter((t) => t.getAttribute('aria-expanded') === 'false');
      return {
        descs: document.querySelectorAll('.path-tier-desc').length,
        toggles: toggles.length,
        badToggle: toggles.filter((t) => !['true', 'false'].includes(t.getAttribute('aria-expanded')) || !document.getElementById(t.getAttribute('aria-controls'))).length,
        collapsed: collapsed.length,
        collapsedMini: collapsed.filter((t) => t.querySelector('.path-mini-bar')?.getBoundingClientRect().width > 0).length,
        hiddenMismatch: toggles.filter((t) => document.getElementById(t.getAttribute('aria-controls')).hidden === (t.getAttribute('aria-expanded') === 'true')).length,
        rowLinks: [...document.querySelectorAll('.path-problems li')].filter((li) => li.firstElementChild?.matches('a.path-row[href^="#/problem/"]')).length,
        nextVisible: Boolean(document.querySelector('.path-problems li.is-next .path-next-tag')?.getClientRects().length),
      };
    });
    if (shape.descs !== 6 || !shape.toggles || shape.badToggle || shape.hiddenMismatch || shape.rowLinks !== 131 || !shape.nextVisible) {
      throw new Error(`learning path structure: ${JSON.stringify(shape)}`);
    }
    if (!shape.collapsed || shape.collapsedMini !== shape.collapsed) throw new Error(`collapsed topics need a visible mini bar: ${JSON.stringify(shape)}`);
    // The disclosure opens and closes its own panel.
    const firstClosed = page.locator('.path-topic-toggle[aria-expanded="false"]').first();
    const panelId = await firstClosed.getAttribute('aria-controls');
    await firstClosed.click();
    if ((await page.getAttribute(`[aria-controls="${panelId}"]`, 'aria-expanded')) !== 'true' || (await page.locator(`#${panelId}`).isHidden())) throw new Error('topic toggle did not open its panel');
    await page.click(`[aria-controls="${panelId}"]`);
    if (!(await page.locator(`#${panelId}`).isHidden())) throw new Error('topic toggle did not close its panel');
    await shot('05-path');
    await page.click('.path-summary a.btn');
    await page.waitForFunction((h) => location.hash === h, next);
    await page.waitForSelector('.problem-title');
  });

  await check('modes hub lists 2 mode cards with 1 primary button and an AI Mentor note', async () => {
    await page.click('a[data-nav="modes"]');
    await page.waitForSelector('.mode-card');
    const hub = await page.evaluate(() => ({
      cards: document.querySelectorAll('.mode-card').length,
      primaries: document.querySelectorAll('#view .btn-primary').length,
      mentorHref: document.querySelector('.mentor-note a[href^="#/problem/"]')?.getAttribute('href') ?? '',
      text: document.querySelector('#view')?.textContent ?? '',
    }));
    if (hub.cards !== 2) throw new Error(`expected 2 mode cards, got ${hub.cards}`);
    if (hub.primaries !== 1) throw new Error(`expected 1 primary button on modes hub, got ${hub.primaries}`);
    if (!hub.mentorHref) throw new Error('expected AI Mentor note with a link to a problem');
    if (/roadmap|phase \d/i.test(hub.text)) throw new Error('modes hub copy should not mention internal roadmap phases');
    await shot('06-modes');
  });

  await check('mock OA: hard format from one company, 3 problems, lockdown, report', async () => {
    await page.goto(`${BASE}#/interview`);
    await page.waitForSelector('.format-grid .format-card');
    await page.waitForSelector('.company-option[data-slug="google"]', { timeout: 15000 });
    // Start button must be visible in the 1440x900 viewport immediately on render.
    const startBox = await page.locator('button:has-text("Start interview")').boundingBox();
    if (!startBox || startBox.y < 0 || startBox.y + startBox.height > 900) {
      throw new Error(`Start interview button is outside 1440x900 viewport on load: ${JSON.stringify(startBox)}`);
    }
    const primaries = await page.locator('#view .btn-primary').count();
    if (primaries !== 1) throw new Error(`expected 1 primary button on interview setup, got ${primaries}`);
    const rulesCount = await page.locator('.setup-rules li').count();
    if (rulesCount !== 3) throw new Error(`expected 3 short rules on interview setup, got ${rulesCount}`);
    await expectText('.format-card[data-format="hard-oa"]', /90 min/);
    await expectText('.format-card[data-format="hard-oa"]', /2 Medium \+ 1 Hard/);
    await page.click('.format-grid button:has-text("Hard OA")');
    if ((await page.getAttribute('.format-card[data-format="hard-oa"]', 'aria-pressed')) !== 'true') {
      throw new Error('Hard OA format card is not pressed');
    }
    // Keyboard inside the shared company picker: arrows move focus, Enter selects, Tab leaves it.
    await page.focus('.picker-options .company-option[tabindex="0"]');
    await page.keyboard.press('ArrowRight');
    const focusedSlug = await page.evaluate(() => document.activeElement?.dataset?.slug ?? '');
    if (!focusedSlug) throw new Error('ArrowRight in company picker did not move focus to a company option');
    await page.keyboard.press('Enter');
    if ((await page.getAttribute(`.company-option[data-slug="${focusedSlug}"]`, 'aria-pressed')) !== 'true') {
      throw new Error(`Enter did not select company option "${focusedSlug}"`);
    }
    await page.keyboard.press('Tab');
    const stillInside = await page.evaluate(() => Boolean(document.activeElement?.closest('.picker-options')));
    if (stillInside) throw new Error('Tab did not leave the company picker options');

    // Search narrows the picker; the selected card has aria-pressed="true".
    await page.fill('input[aria-label="Search companies"]', 'goog');
    await page.waitForFunction(() => document.querySelectorAll('.company-option').length === 2);
    await page.click('.company-option[data-slug="google"]');
    if ((await page.getAttribute('.company-option[data-slug="google"]', 'aria-pressed')) !== 'true') throw new Error('selected company option is not pressed');
    await expectText('.picker-selected', /Google/);
    await page.fill('input[aria-label="Search companies"]', '');
    await page.click('.segmented-btn:has-text("All")');
    if ((await page.locator('.company-option').count()) <= 2) throw new Error('"All" should list more companies');
    await shot('06-oa-setup-picker');
    await expectText('.setup-bar', /90 min/);
    await expectText('.setup-bar', /2 Medium \+ 1 Hard/);
    await expectText('.setup-bar', /asked at Google/);
    await shot('06-oa-setup');
    await page.click('button:has-text("Start interview")');
    await page.waitForSelector('.session-banner.interview');
    await expectText('.session-banner .clock', /^(90:00|89:5\d)$/);
    const tabs = await page.locator('.problem-switcher button').count();
    if (tabs !== 3) throw new Error(`expected 3 problems, got ${tabs}`);
    if (await page.locator('.complexity-body').count()) throw new Error('complexity shown during a timed session');
    await page.click('button:has-text("End interview")');
    await page.click('dialog.modal button:has-text("End interview")');
    await page.waitForSelector('.score-ring');
    await page.click('button:has-text("New interview")');
    await page.waitForSelector('.format-grid');
  });

  await check('interview: lockdown hides nav, reveal disabled, switcher tracks status, end produces banded report with Review links', async () => {
    await page.goto(`${BASE}#/interview`);
    await page.click('button:has-text("Start interview")');
    await page.waitForSelector('.session-banner.interview');
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    if (await page.locator('.app-header').isVisible()) throw new Error('nav visible during lockdown');
    if (!(await page.locator('button[data-action="reveal"]').isDisabled())) throw new Error('reveal enabled during interview');
    if ((await page.getAttribute('.problem-switcher button:first-child', 'data-status')) !== 'todo') {
      throw new Error('problem 1 should start as todo in problem switcher');
    }
    await page.click('button[data-action="run"]');
    await page.waitForSelector('.result-head', { timeout: 30000 });
    if ((await page.getAttribute('.problem-switcher button:first-child', 'data-status')) !== 'tried') {
      throw new Error('problem 1 should update to tried after a run');
    }
    await expectText('.problem-switcher button:first-child', /Tried/);
    await shot('07-interview');
    await page.click('button:has-text("End interview")');
    await page.click('dialog.modal button:has-text("End interview")');
    await page.waitForSelector('.score-ring[data-band]');
    await page.waitForSelector('.score-band');
    if (!(await page.locator('.app-header').isVisible())) throw new Error('nav not restored after interview');
    const reportRows = await page.evaluate(() =>
      [...document.querySelectorAll('.report-problem')].map((row) => ({
        title: row.querySelector('.report-problem-title')?.textContent ?? '',
        hasDiff: Boolean(row.querySelector('.difficulty')),
        href: row.querySelector('a.report-review')?.getAttribute('href') ?? '',
        label: row.querySelector('a.report-review')?.getAttribute('aria-label') ?? '',
      })),
    );
    if (reportRows.length !== 2 || reportRows.some((r) => !r.hasDiff || !r.href.startsWith('#/problem/') || !r.label.includes(r.title))) {
      throw new Error(`report rows missing difficulty or named Review link: ${JSON.stringify(reportRows)}`);
    }
    await shot('08-report');
    // Reset to setup so subsequent 390px route checks capture and measure the setup screen.
    await page.click('button:has-text("New interview")');
    await page.waitForSelector('.format-grid');
    // The Modes hub now surfaces the last finished interview summary.
    await page.goto(`${BASE}#/modes`);
    await page.waitForSelector('.mode-card .mode-last');
    await expectText('.mode-card .mode-last', /Last session:.*\/ 100/);
  });

  await check('interview timer: warning colour and single "5 minutes left" announcement in the last five minutes', async () => {
    const clockPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    clockPage.on('console', (m) => m.type() === 'error' && errors.push(`console (clock page): ${m.text()}`));
    clockPage.on('pageerror', (e) => errors.push(`pageerror (clock page): ${e.message}`));
    await clockPage.addInitScript(() => {
      window.LFB_SUPABASE_URL = '';
      window.LFB_SUPABASE_ANON_KEY = '';
    });
    await clockPage.clock.install();
    await clockPage.goto(`${BASE}#/interview`);
    await clockPage.waitForSelector('.format-grid');
    await clockPage.click('.format-card[data-format="screen"]');
    await clockPage.click('button:has-text("Start interview")');
    await clockPage.waitForSelector('.session-banner.interview .clock');
    const beforeWarn = await clockPage.evaluate(() => {
      const live = document.querySelector('.session-live');
      return {
        hasWarn: document.querySelector('.session-banner .clock').classList.contains('warning'),
        pillHidden: document.querySelector('.session-alert').hidden,
        livePresent: Boolean(live),
        liveHidden: Boolean(live?.hidden) || getComputedStyle(live).display === 'none',
        liveRole: live?.getAttribute('role'),
        liveAttr: live?.getAttribute('aria-live'),
        liveText: live?.textContent ?? '',
      };
    });
    if (
      beforeWarn.hasWarn ||
      !beforeWarn.pillHidden ||
      !beforeWarn.livePresent ||
      beforeWarn.liveHidden ||
      beforeWarn.liveRole !== 'status' ||
      beforeWarn.liveAttr !== 'polite' ||
      beforeWarn.liveText !== ''
    ) {
      throw new Error(`5-minute live region should be mounted, unhidden, and empty before warning: ${JSON.stringify(beforeWarn)}`);
    }
    await clockPage.evaluate(() => {
      window.__warnAnnouncements = 0;
      const el = document.querySelector('.session-live');
      new MutationObserver(() => {
        if (el.textContent.includes('5 minutes left')) window.__warnAnnouncements++;
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
    // Jump 40m02s into the 45-minute phone screen so ~4:58 remains.
    await clockPage.clock.fastForward('40:02');
    const inWarn = await clockPage.evaluate(() => ({
      hasWarn: document.querySelector('.session-banner .clock').classList.contains('warning'),
      pillHidden: document.querySelector('.session-alert').hidden,
      pillText: document.querySelector('.session-alert').textContent,
      liveText: document.querySelector('.session-live').textContent,
      announcements: window.__warnAnnouncements,
    }));
    if (!inWarn.hasWarn || inWarn.pillHidden || inWarn.pillText !== '5 minutes left' || inWarn.liveText !== '5 minutes left' || inWarn.announcements !== 1) {
      throw new Error(`unexpected 5-minute warning state: ${JSON.stringify(inWarn)}`);
    }
    // Several more ticks inside the last 5 minutes must not repeat the announcement.
    await clockPage.clock.fastForward('00:05');
    const countAfter = await clockPage.evaluate(() => window.__warnAnnouncements);
    if (countAfter !== 1) throw new Error(`"5 minutes left" announced ${countAfter} times, expected 1`);
    await clockPage.close();
  });

  await check('battle setup: opponent cards, difficulty and topic chips (no select), keyboard picker, pinned Start', async () => {
    await page.goto(`${BASE}#/battle`);
    await page.waitForSelector('.pick-row');
    // Start button must be visible in the 1440x900 viewport immediately on render, with no <select>.
    const startBox = await page.locator('button:has-text("Start race")').boundingBox();
    if (!startBox || startBox.y < 0 || startBox.y + startBox.height > 900) {
      throw new Error(`Start race button is outside 1440x900 viewport on load: ${JSON.stringify(startBox)}`);
    }
    if (await page.locator('#view select').count()) throw new Error('battle setup should use chips, not <select>');
    if ((await page.locator('.opponent-card').count()) !== 3) throw new Error('expected 3 opponent cards');
    await expectText('.opponent-card[data-level="grandmaster"]', /Fast pace/);
    await expectText('.pick-row:first-child', /Easy|Medium|Hard/);
    if (!(await page.locator('.pick-row >> nth=0').locator('.tag').count())) throw new Error('problem row shows no topic');

    // Keyboard inside the battle problem picker: ArrowDown moves, Enter selects, Tab leaves.
    await page.focus('.picker-options .pick-row[tabindex="0"]');
    const firstId = await page.evaluate(() => document.activeElement?.dataset?.id ?? '');
    await page.keyboard.press('ArrowDown');
    const secondId = await page.evaluate(() => document.activeElement?.dataset?.id ?? '');
    if (!secondId || secondId === firstId) throw new Error(`ArrowDown did not move focus in battle picker (${firstId} -> ${secondId})`);
    await page.keyboard.press('Enter');
    if ((await page.getAttribute(`.pick-row[data-id="${secondId}"]`, 'aria-pressed')) !== 'true') {
      throw new Error('Enter did not select focused battle problem row');
    }
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => Boolean(document.activeElement?.closest('.picker-options')))) {
      throw new Error('Tab did not leave the battle problem picker');
    }

    const totalText = await page.locator('.picker-count').textContent();
    const totalMatch = Number(totalText.match(/^(\d+) of (\d+)/)?.[1] ?? 0);
    await page.click('.chip-group[aria-label="Difficulty"] button:has-text("Hard")');
    const hardText = await page.locator('.picker-count').textContent();
    const hardMatch = Number(hardText.match(/^(\d+) of (\d+)/)?.[1] ?? 0);
    if (!(hardMatch > 0 && hardMatch < totalMatch)) throw new Error(`difficulty filter should narrow the list (${hardMatch} vs ${totalMatch})`);
    const nonHard = await page.locator('.pick-row:not(:has(.diff-hard))').count();
    if (nonHard) throw new Error('hard filter shows other difficulties');

    // Topic disclosure chip (no aria-pressed) filters by topic and closes on Escape.
    await page.click('.topic-toggle');
    await page.waitForSelector('#battle-topics:not([hidden])');
    if (await page.evaluate(() => document.querySelector('.topic-toggle').hasAttribute('aria-pressed'))) {
      throw new Error('battle topic toggle should be a disclosure only (no aria-pressed)');
    }
    await page.click('#battle-topics .chip:has-text("Graphs")');
    await expectText('.topic-toggle', /Topic: Graphs/);
    await page.keyboard.press('Escape');
    await page.waitForSelector('#battle-topics', { state: 'hidden' });

    await page.fill('input[aria-label="Search problems"]', 'zzzz-no-such-problem');
    await page.waitForSelector('.picker-empty:not([hidden]) .state');
    await page.click('.picker-empty button:has-text("Clear filters")');
    await page.waitForSelector('.pick-row');
    await page.click('.chip-group[aria-label="Difficulty"] button:has-text("Hard")');
    await page.click('button:has-text("Random")');
    await page.waitForSelector('.pick-row[aria-pressed="true"]');
    await shot('09a-battle-setup');
    await page.click('.chip-group[aria-label="Difficulty"] button:has-text("All difficulties")');
  });

  await check('battle: lockdown hides nav, two distinct thick race bars, Leave race restores nav', async () => {
    await page.goto(`${BASE}#/battle`);
    await page.click('button:has-text("Start race")');
    await page.waitForSelector('.session-banner.battle .race-row');
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    if (await page.locator('.app-header').isVisible()) throw new Error('nav visible during battle race');
    const race = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.race-row')];
      const track = document.querySelector('.race-track');
      const youColor = getComputedStyle(document.querySelector('.race-fill-you')).backgroundColor;
      const botColor = getComputedStyle(document.querySelector('.race-fill-bot')).backgroundColor;
      return { count: rows.length, trackHeight: track?.getBoundingClientRect().height ?? 0, youColor, botColor };
    });
    if (race.count !== 2) throw new Error(`expected 2 race rows, got ${race.count}`);
    if (race.trackHeight < 9.5) throw new Error(`race bar track too thin: ${race.trackHeight}px`);
    if (race.youColor === race.botColor) throw new Error(`race bars should use two distinct colours, both were ${race.youColor}`);
    await shot('09-battle');
    await page.click('button:has-text("Leave race")');
    await page.click('dialog.modal button:has-text("Leave race")');
    await page.waitForSelector('.opponent-grid');
    if (!(await page.locator('.app-header').isVisible())) throw new Error('nav not restored after leaving battle race');
  });

  await check('phone workspace: Description / Code / Results tabs, pinned Run / Submit, verdict in view', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}#/problem/smallest-base-segment`);
    await page.waitForSelector('.monaco-editor', { state: 'attached', timeout: 30000 });
    await shot('10-mobile');
    const wsTabs = await page.evaluate(() => {
      const list = document.querySelector('.ws-tabs');
      return {
        role: list?.getAttribute('role'),
        tabs: [...list.querySelectorAll('[role="tab"]')].map((t) => ({ text: t.textContent, selected: t.getAttribute('aria-selected'), tabindex: t.tabIndex, panel: document.getElementById(t.getAttribute('aria-controls'))?.getAttribute('role') })),
        siteTabBar: getComputedStyle(document.querySelector('.tab-bar')).display,
      };
    });
    const want = ['Description', 'Code', 'Results'];
    if (wsTabs.role !== 'tablist' || wsTabs.tabs.map((t) => t.text).join() !== want.join()) throw new Error(`workspace tabs: ${JSON.stringify(wsTabs)}`);
    if (wsTabs.tabs[0].selected !== 'true' || wsTabs.tabs.filter((t) => t.tabindex === 0).length !== 1 || wsTabs.tabs.some((t) => t.panel !== 'tabpanel')) {
      throw new Error(`workspace tabs break the ARIA tabs pattern: ${JSON.stringify(wsTabs)}`);
    }
    if (wsTabs.siteTabBar !== 'none') throw new Error('site tab bar should give way to the Run / Submit bar');
    // Arrow keys move between tabs (roving tabindex).
    await page.focus('.ws-tab[aria-selected="true"]');
    await page.keyboard.press('ArrowRight');
    if ((await page.evaluate(() => document.activeElement?.textContent)) !== 'Code') throw new Error('ArrowRight did not move to the Code tab');
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    const inView = (sel) =>
      page.evaluate((s) => {
        const el = document.querySelector(s);
        const r = el?.getBoundingClientRect();
        return Boolean(r && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth);
      }, sel);
    for (const label of ['Run', 'Submit']) {
      if (!(await inView(`.ws-actions .btn[data-action="${label.toLowerCase()}"]`))) throw new Error(`${label} not visible without scrolling on the Code tab`);
    }
    await shot('10-mobile-code');
    await page.click('.ws-actions .btn[data-action="run"]');
    await page.waitForSelector('.result-head', { timeout: 30000 });
    if ((await page.getAttribute('.ws-tab:has-text("Results")', 'aria-selected')) !== 'true') throw new Error('Run did not switch to the Results tab');
    if (!(await inView('.result-head'))) throw new Error('verdict is not visible without scrolling after Run');
    if ((await page.getAttribute('.console-body', 'role')) !== 'status') throw new Error('verdict region lost role="status"');
    await shot('10-mobile-results');
    await page.click('.ws-tab:has-text("Code")');
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    // The page must never scroll sideways on a phone: anything wider than the viewport is clipped
    // for the reader (company chips, statement). Wide content scrolls inside its own container.
    const mobileRoutes = [
      { name: '390-dashboard', url: '#/', wait: '.problem-table tbody tr a.problem-link', footer: true },
      { name: '390-workspace', url: '#/problem/smallest-base-segment', wait: '.ws-tab[aria-selected="true"]', footer: false },
      { name: '390-path', url: '#/path', wait: '.path-tier', footer: true },
      { name: '390-companies', url: '#/companies', wait: '.company-card', footer: true },
      { name: '390-company-google', url: '#/companies/google', wait: '.problem-table tbody tr', footer: true },
      { name: '390-modes', url: '#/modes', wait: '.mode-card', footer: true },
      { name: '390-interview', url: '#/interview', wait: '.setup-card', footer: true },
      { name: '390-battle', url: '#/battle', wait: '.pick-row', footer: true },
      { name: '390-privacy', url: 'privacy.html', wait: 'article.legal h1', footer: false },
    ];
    for (const r of mobileRoutes) {
      await page.goto(`${BASE}${r.url}`);
      await page.waitForSelector(r.wait, { timeout: 30000 });
      await page.waitForTimeout(400);
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
      if (scrollWidth > innerWidth) throw new Error(`${r.url} overflows at 390px: scrollWidth ${scrollWidth} > ${innerWidth}`);
      if (r.footer && (await page.locator('footer.site-links a[href="privacy.html"]').count()) !== 1) {
        throw new Error(`${r.url} missing shared privacy footer`);
      }
      await shot(r.name);
    }

    // Company page on a phone: list rows, titles at most two lines, off-site rows hidden by default,
    // and two company cards per row.
    await page.goto(`${BASE}#/companies/google`);
    await page.waitForSelector('.company-table tbody tr');
    const phoneCompany = await page.evaluate(() => {
      const titles = [...document.querySelectorAll('.company-table .company-problem')].map((el) => {
        const lh = parseFloat(getComputedStyle(el).lineHeight);
        return { text: el.textContent, lines: Math.round(el.getBoundingClientRect().height / lh) };
      });
      const rows = [...document.querySelectorAll('.company-table tbody tr')].map((tr) => tr.getBoundingClientRect().height);
      return { onSite: document.querySelector('#on-site-only')?.getAttribute('aria-pressed'), offsite: document.querySelectorAll('.company-table tr.row-offsite').length, tooTall: titles.filter((t) => t.lines > 2), shortRows: rows.filter((hgt) => hgt < 52).length };
    });
    if (phoneCompany.onSite !== 'true' || phoneCompany.offsite) throw new Error(`phone company page should start with on-site rows only: ${JSON.stringify(phoneCompany)}`);
    if (phoneCompany.tooTall.length) throw new Error(`company titles wrap past two lines at 390px: ${JSON.stringify(phoneCompany.tooTall.slice(0, 3))}`);
    if (phoneCompany.shortRows) throw new Error(`${phoneCompany.shortRows} company list rows under 52px`);
    // Learning path rows on a phone: the subtopic sits on its own line under the title, one line
    // high, never squeezed into a narrow column beside it.
    await page.goto(`${BASE}#/path`);
    await page.waitForSelector('.path-row');
    const pathRows = await page.evaluate(() =>
      [...document.querySelectorAll('.path-row')]
        .filter((r) => r.getClientRects().length)
        .map((r) => {
          const t = r.querySelector('.path-row-title').getBoundingClientRect();
          const c = r.querySelector('.path-concept');
          const cr = c.getBoundingClientRect();
          return { text: c.textContent, below: cr.top >= t.bottom - 1, oneLine: cr.height <= parseFloat(getComputedStyle(c).lineHeight) * 1.5 };
        }),
    );
    const badRows = pathRows.filter((r) => !r.below || !r.oneLine);
    if (!pathRows.length || badRows.length) throw new Error(`path subtopics wrap beside the title at 390px: ${JSON.stringify(badRows.slice(0, 3))}`);
    await page.goto(`${BASE}#/companies`);
    await page.waitForSelector('.company-card');
    const cardTops = await page.evaluate(() => [...document.querySelectorAll('.company-card')].slice(0, 2).map((c) => Math.round(c.getBoundingClientRect().top)));
    if (cardTops[0] !== cardTops[1]) throw new Error(`expected two company cards per row at 390px: ${JSON.stringify(cardTops)}`);

    // Setup screens at 390x844: Start button is in the viewport at or above .tab-bar's top
    // right on render, elementFromPoint at its center lands inside .setup-bar, and pickers do
    // not create nested scroll boxes on phones.
    for (const setup of [
      { url: '#/interview', wait: '.company-option[data-slug="google"]', button: 'Start interview' },
      { url: '#/battle', wait: '.pick-row', button: 'Start race' },
    ]) {
      await page.goto(`${BASE}${setup.url}`);
      await page.waitForSelector(setup.wait, { timeout: 30000 });
      const checkBar = await page.evaluate((label) => {
        const btn = [...document.querySelectorAll('.setup-bar button')].find((b) => b.textContent.trim() === label);
        const tab = document.querySelector('.tab-bar');
        if (!btn || !tab) return { missing: true };
        const br = btn.getBoundingClientRect();
        const tr = tab.getBoundingClientRect();
        const hit = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
        return {
          top: br.top,
          bottom: br.bottom,
          tabTop: tr.top,
          hitsBar: Boolean(hit?.closest('.setup-bar')),
          overflowY: getComputedStyle(document.querySelector('.picker-options')).overflowY,
        };
      }, setup.button);
      if (checkBar.missing || checkBar.top < 0 || checkBar.bottom > 844 || checkBar.bottom > checkBar.tabTop + 1 || !checkBar.hitsBar) {
        throw new Error(`${setup.url} "${setup.button}" failed 390x844 Start-in-viewport check: ${JSON.stringify(checkBar)}`);
      }
      if (checkBar.overflowY === 'auto' || checkBar.overflowY === 'scroll') {
        throw new Error(`${setup.url} picker uses an inner scroll box on phones (overflowY=${checkBar.overflowY})`);
      }
    }

    // Tab bar geometry, touch height >= 44px, header title, and single aria-current across all 4 tabs.
    await page.goto(`${BASE}#/`);
    await page.waitForSelector('.problem-table tbody tr a.problem-link');
    const headerState = await page.evaluate(() => ({
      navHidden: getComputedStyle(document.querySelector('.nav')).display === 'none',
      brandNameHidden: getComputedStyle(document.querySelector('.brand-name')).display === 'none',
      titleVisible: getComputedStyle(document.querySelector('#header-title')).display !== 'none',
      // aria-label on a plain span is not exposed (ARIA 1.2), so the name is the .sr-only text.
      streakAriaLabel: document.querySelector('#streak-chip')?.getAttribute('aria-label'),
      streakSr: document.querySelector('#streak-chip .sr-only')?.textContent,
      streakHiddenParts: [...document.querySelectorAll('#streak-chip [aria-hidden="true"]')].length,
    }));
    if (!headerState.navHidden || !headerState.brandNameHidden || !headerState.titleVisible) {
      throw new Error(`unexpected mobile header state: ${JSON.stringify(headerState)}`);
    }
    if (headerState.streakAriaLabel !== null || !/^\d+-day streak$/.test(headerState.streakSr ?? '') || headerState.streakHiddenParts < 2) {
      throw new Error(`streak chip not accessible: ${JSON.stringify(headerState)}`);
    }

    const tabs = [
      { key: 'problems', title: 'Problems' },
      { key: 'path', title: 'Learning Path' },
      { key: 'companies', title: 'Companies' },
      { key: 'modes', title: 'Modes' },
    ];
    for (const t of tabs) {
      await page.click(`.tab-bar a[data-nav="${t.key}"]`);
      await page.waitForFunction((k) => document.querySelector(`.tab-bar a[data-nav="${k}"]`)?.getAttribute('aria-current') === 'page', t.key);
      const navCheck = await page.evaluate(() => {
        const barLinks = [...document.querySelectorAll('.tab-bar a')].map((a) => {
          const r = a.getBoundingClientRect();
          return { nav: a.dataset.nav, current: a.getAttribute('aria-current'), left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height };
        });
        return {
          barLinks,
          barCurrent: document.querySelectorAll('.tab-bar a[aria-current="page"]').length,
          headerCurrent: document.querySelectorAll('.nav a[aria-current="page"]').length,
          title: document.querySelector('#header-title')?.textContent,
        };
      });
      if (navCheck.barLinks.length !== 4) throw new Error(`expected 4 tab-bar links, got ${navCheck.barLinks.length}`);
      for (const l of navCheck.barLinks) {
        if (l.height < 44 || l.left < -0.5 || l.right > 390.5 || l.top < 0 || l.bottom > 844.5) {
          throw new Error(`tab-bar link ${l.nav} out of bounds or under 44px: ${JSON.stringify(l)}`);
        }
      }
      if (navCheck.barCurrent !== 1 || navCheck.headerCurrent !== 1) {
        throw new Error(`expected single aria-current per nav, got bar=${navCheck.barCurrent} header=${navCheck.headerCurrent}`);
      }
      if (navCheck.title !== t.title) throw new Error(`expected header title "${t.title}", got "${navCheck.title}"`);
    }

    // Keyboard tab order: skip-link -> header -> content (#view) -> tab-bar.
    await page.goto(`${BASE}#/modes`);
    await page.waitForSelector('.mode-card');
    const domOrderOk = await page.evaluate(() => {
      const skip = document.querySelector('.skip-link');
      const header = document.querySelector('.app-header');
      const main = document.querySelector('#view');
      const bar = document.querySelector('.tab-bar');
      const before = (a, b) => Boolean(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
      return before(skip, header) && before(header, main) && before(main, bar);
    });
    if (!domOrderOk) throw new Error('DOM order is not skip-link -> header -> #view -> tab-bar');
    await page.focus('.skip-link');
    const regions = ['skip'];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const region = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';
        if (el.classList.contains('skip-link')) return 'skip';
        if (el.closest('.app-header')) return 'header';
        if (el.closest('#view')) return 'view';
        if (el.closest('.tab-bar')) return 'tab-bar';
        return 'other';
      });
      if (regions[regions.length - 1] !== region) regions.push(region);
      if (region === 'tab-bar') break;
    }
    if (regions.join('>') !== 'skip>header>view>tab-bar') {
      throw new Error(`unexpected keyboard Tab order: ${regions.join(' > ')}`);
    }

    // Mobile lockdown hides both header and tab bar; confirm dialog opens as a full-width bottom sheet.
    await page.goto(`${BASE}#/interview`);
    await page.waitForSelector('.setup-card');
    if (await page.locator('button:has-text("New interview")').isVisible()) {
      await page.click('button:has-text("New interview")');
      await page.waitForSelector('button:has-text("Start interview")');
    }
    await page.click('button:has-text("Start interview")');
    await page.waitForSelector('.session-banner.interview');
    if (await page.locator('.app-header').isVisible()) throw new Error('header visible during 390px lockdown');
    if (await page.locator('.tab-bar').isVisible()) throw new Error('tab-bar visible during 390px lockdown');
    await page.click('button:has-text("End interview")');
    await page.waitForSelector('dialog.modal[open]');
    await page.waitForTimeout(300); // let sheet-up animation finish before measuring
    const sheet = await page.evaluate(() => {
      const dlg = document.querySelector('dialog.modal');
      const r = dlg.getBoundingClientRect();
      const btns = [...dlg.querySelectorAll('.modal-actions .btn')].map((b) => b.getBoundingClientRect().height);
      return { x: r.x, width: r.width, bottom: r.bottom, labelledby: dlg.getAttribute('aria-labelledby'), describedby: dlg.getAttribute('aria-describedby'), btns };
    });
    if (sheet.width < 388 || Math.abs(sheet.bottom - 844) > 2) throw new Error(`mobile dialog is not a full-width bottom sheet: ${JSON.stringify(sheet)}`);
    if (!sheet.labelledby || !sheet.describedby) throw new Error(`dialog missing aria references: ${JSON.stringify(sheet)}`);
    if (sheet.btns.some((h) => h < 44)) throw new Error(`mobile dialog buttons under 44px: ${JSON.stringify(sheet.btns)}`);
    // Clicking the backdrop outside .modal-card closes the dialog and returns focus to End interview.
    await page.mouse.click(10, 10);
    await page.waitForSelector('dialog.modal', { state: 'detached' });
    const focusedAfterBackdrop = await page.evaluate(() => document.activeElement?.textContent?.trim());
    if (focusedAfterBackdrop !== 'End interview') throw new Error(`focus did not return to opener after backdrop dismiss: "${focusedAfterBackdrop}"`);
    await page.click('button:has-text("End interview")');
    await page.waitForSelector('dialog.modal[open]');
    await page.click('dialog.modal button:has-text("End interview")');
    await page.waitForSelector('.score-ring');
    if (!(await page.locator('.app-header').isVisible()) || !(await page.locator('.tab-bar').isVisible())) {
      throw new Error('header or tab-bar not restored after 390px interview');
    }
    if ((await page.locator('footer.site-links a[href="privacy.html"]').count()) !== 1) {
      throw new Error('interview report missing shared footer');
    }

    await page.goto(`${BASE}#/`);
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  await check('touch: every control on the browse and setup screens is at least 44px tall, and chips and tags look different', async () => {
    // hasTouch makes (pointer: coarse) match, which is what promotes the --ctl-* tokens to 44 px.
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const touch = await ctx.newPage();
    touch.on('console', (m) => m.type() === 'error' && errors.push(`console (touch page): ${m.text()}`));
    touch.on('pageerror', (e) => errors.push(`pageerror (touch page): ${e.message}`));
    // Accounts on with a stub client, so the Sign in panel is measured too; no network.
    await touch.route('**/@supabase/supabase-js@*/+esm', (r) =>
      r.fulfill({ contentType: 'text/javascript', body: 'export function createClient() { return { auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({}) } }; }' }),
    );
    await touch.addInitScript(() => {
      window.LFB_REMOTE_RUNNER_URL = '';
      window.LFB_SUPABASE_URL = 'https://example.supabase.co';
      window.LFB_SUPABASE_ANON_KEY = 'public-anon-key';
    });
    const undersized = () =>
      touch.evaluate(() => {
        const out = [];
        for (const root of ['.app-header', '#view', '.tab-bar'].map((sel) => document.querySelector(sel)).filter(Boolean)) {
          for (const el of root.querySelectorAll('a[href], button, input:not([type="hidden"]), select, summary')) {
            // A checkbox or radio is tapped through its label, so the label is the target.
            const target = el.matches('input[type="checkbox"], input[type="radio"]') ? (el.closest('label') ?? el) : el;
            const r = target.getBoundingClientRect();
            if (!r.width || !r.height || getComputedStyle(target).visibility === 'hidden') continue;
            // Allow-list: links inside running text, which follow the line height by design.
            if (el.closest('p, .hint-text, .page-sub, .statement')) continue;
            // 43.5 absorbs subpixel layout (a 44 px control can measure 43.99).
            if (r.height < 43.5) out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${(el.textContent || el.getAttribute('placeholder') || '').trim().slice(0, 30)}" ${r.height.toFixed(1)}px`);
          }
        }
        return [...new Set(out)];
      });
    const screens = [
      { url: '#/', wait: '.problem-table tbody tr a.problem-link', name: '390-touch-dashboard' },
      { url: '#/path', wait: '.path-row', name: '390-touch-path' },
      { url: '#/companies', wait: '.company-card', name: '390-touch-companies' },
      { url: '#/companies/google', wait: '.problem-table tbody tr', name: '390-touch-company' },
      { url: '#/modes', wait: '.mode-card', name: '390-touch-modes' },
      { url: '#/interview', wait: '.company-option[data-slug="google"]', name: '390-touch-interview', startButton: 'Start interview' },
      { url: '#/battle', wait: '.pick-row', name: '390-touch-battle', startButton: 'Start race' },
      { url: 'privacy.html', wait: 'article.legal h1', name: '390-touch-privacy' },
    ];
    for (const sc of screens) {
      await touch.goto(`${BASE}${sc.url}`);
      await touch.waitForSelector(sc.wait, { timeout: 30000 });
      await touch.waitForTimeout(300);
      const bad = await undersized();
      if (bad.length) throw new Error(`${sc.url} has touch targets under 44px:\n  ${bad.join('\n  ')}`);
      if (sc.startButton) {
        const startCheck = await touch.evaluate((label) => {
          const btn = [...document.querySelectorAll('.setup-bar button')].find((b) => b.textContent.trim() === label);
          const tab = document.querySelector('.tab-bar');
          if (!btn || !tab) return { missing: true };
          const br = btn.getBoundingClientRect();
          const tr = tab.getBoundingClientRect();
          const hit = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
          return { top: br.top, bottom: br.bottom, tabTop: tr.top, hitsBar: Boolean(hit?.closest('.setup-bar')) };
        }, sc.startButton);
        if (startCheck.missing || startCheck.top < 0 || startCheck.bottom > 844 || startCheck.bottom > startCheck.tabTop + 1 || !startCheck.hitsBar) {
          throw new Error(`${sc.url} "${sc.startButton}" failed 390x844 touch Start-in-viewport check: ${JSON.stringify(startCheck)}`);
        }
      }
      if (shotsDir) await touch.screenshot({ path: `${shotsDir}/${sc.name}.png` });
    }
    // The Sign in panel (a phone sheet) follows the same rule.
    await touch.goto(`${BASE}#/`);
    await touch.click('#account .account-toggle');
    await touch.waitForSelector('.account-menu:not([hidden]) button:has-text("Continue with GitHub")');
    const panel = await touch.evaluate(() => [...document.querySelectorAll('.account-menu button')].map((b) => b.getBoundingClientRect().height));
    if (panel.some((hgt) => hgt < 43.5)) throw new Error(`account panel buttons under 44px: ${JSON.stringify(panel)}`);
    // One shape per job: a filter chip is a pill, a static tag is a 4px rectangle, and a selected
    // chip shows a check mark, so selection is not colour alone. On a 390x844 phone the first
    // problem link must be visible without scrolling (within the first 844 px).
    await touch.goto(`${BASE}#/`);
    await touch.waitForSelector('.problem-table tbody tr a.problem-link');
    await touch.waitForSelector('.today-card .today-cta');
    const firstRow = await touch.evaluate(() => {
      const link = document.querySelector('.dashboard-table tbody tr a.problem-link');
      const row = link.closest('tr');
      const lr = link.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      return { linkTop: lr.top, linkBottom: lr.bottom, rowHeight: rr.height };
    });
    if (firstRow.linkTop < 0 || firstRow.linkBottom > 844 || firstRow.linkTop >= 788) {
      throw new Error(`first problem link is below the fold at 390x844: ${JSON.stringify(firstRow)}`);
    }
    if (firstRow.rowHeight < 52) {
      throw new Error(`mobile dashboard list row under 52px: ${JSON.stringify(firstRow)}`);
    }
    const shapes = await touch.evaluate(() => {
      const chip = document.querySelector('.chip-group[aria-label="Difficulty"] .chip[aria-pressed="true"]');
      const tag = document.querySelector('.problem-table .tag');
      const diff = document.querySelector('.problem-table .difficulty');
      return {
        chipRadius: parseFloat(getComputedStyle(chip).borderTopLeftRadius),
        chipCheck: getComputedStyle(chip, '::before').content,
        tagRadius: parseFloat(getComputedStyle(tag).borderTopLeftRadius),
        tagBorder: getComputedStyle(tag).borderTopWidth,
        diffDot: getComputedStyle(diff, '::before').width,
        diffText: diff.textContent,
      };
    });
    if (shapes.chipRadius < 15 || shapes.tagRadius > 4 || shapes.tagBorder !== '0px' || !/✓/.test(shapes.chipCheck)) {
      throw new Error(`chip and tag shapes are not distinct: ${JSON.stringify(shapes)}`);
    }
    if (shapes.diffDot !== '8px' || !/^(Easy|Medium|Hard)$/.test(shapes.diffText)) throw new Error(`difficulty is not dot plus word: ${JSON.stringify(shapes)}`);
    await ctx.close();
  });

  // Its own page: the blocked CDN request is logged as a failed resource, which is the point here.
  await check('without Monaco, TypeScript reports honestly that it needs the editor and nothing crashes', async () => {
    const offline = await browser.newPage();
    await offline.addInitScript(() => {
      window.LFB_SUPABASE_URL = '';
      window.LFB_SUPABASE_ANON_KEY = '';
    });
    const offlineErrors = [];
    offline.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && offlineErrors.push(m.text()));
    offline.on('pageerror', (e) => offlineErrors.push(e.message));
    await offline.route(/monaco-editor@/, (route) => route.abort());
    await offline.goto(`${BASE}#/problem/smallest-base-segment`);
    await offline.waitForSelector('textarea.fallback-editor', { timeout: 30000 });
    await offline.selectOption('.toolbar select', 'typescript');
    await offline.click('button[data-action="run"]');
    await offline.waitForFunction(() => /Language Not Supported Yet/.test(document.querySelector('.result-head')?.textContent ?? ''), null, { timeout: 15000 });
    await offline.waitForFunction(() => /could not load/.test(document.querySelector('.case-detail')?.textContent ?? ''));
    await offline.selectOption('.toolbar select', 'javascript');
    await offline.close();
    if (offlineErrors.length) throw new Error(offlineErrors.join(' | '));
  });

  await check('dashboard: problem of the day and weak spots from the session so far', async () => {
    await page.goto(`${BASE}#/`);
    await page.waitForSelector('.today-card .problem-link', { timeout: 15000 });
    // Earlier steps solved problems after revealing the solution, which must surface as weak spots.
    await page.waitForSelector('.weak-list li', { timeout: 15000 });
    await expectText('.weak-list', /solution revealed/);
    await shot('17-today');
    const href = await page.locator('.today-card .problem-link').getAttribute('href');
    await page.click('.today-card .problem-link');
    await page.waitForFunction((h) => location.hash === h, href);
    await page.waitForSelector('.problem-title');
  });

  await check('accounts: hidden without config; Sign in offers Google and GitHub; a session shows the user; GitHub sync pushes an Accepted solve', async () => {
    if (await page.locator('#account button').count()) throw new Error('sign-in shown although accounts are not configured');
    // A separate page (and storage) so the stubbed account never touches the main page's progress.
    const acct = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    acct.on('pageerror', (e) => errors.push(`account page: ${e.message}`));
    acct.on('console', (m) => m.type() === 'error' && errors.push(`console (account page): ${m.text()}`));
    // A stub stands in for supabase-js: no network, and the test decides whether a session exists.
    const stub = (signedIn) => `export function createClient() {
      const listeners = [];
      const user = ${signedIn ? "{ id: 'u1', email: 'ada@example.com', user_metadata: { full_name: 'Ada' } }" : 'null'};
      const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: null, error: null }), upsert: async () => ({ error: null }) };
      return { auth: { getSession: async () => ({ data: { session: user ? { user, access_token: 'jwt' } : null } }), onAuthStateChange: (cb) => { listeners.push(cb); return {}; }, signInWithOAuth: async () => ({}), signOut: async () => { localStorage.removeItem('sb-example-auth-token'); listeners.forEach((l) => l('SIGNED_OUT', null)); return {}; } }, from: () => chain };
    }`;
    const acctRequests = [];
    acct.on('request', (r) => acctRequests.push(r.url()));
    let signedIn = false;
    await acct.route('**/@supabase/supabase-js@*/+esm', (r) => r.fulfill({ contentType: 'text/javascript', body: stub(signedIn) }));
    // A fake github-sync Edge Function: first not linked (the wizard), then linked to one repository; records pushes.
    const pushes = [];
    let linked = false;
    await acct.route('https://example.supabase.co/functions/v1/github-sync/**', async (r) => {
      const path = new URL(r.request().url()).pathname;
      const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
      if (path.endsWith('/push')) {
        pushes.push(JSON.parse(r.request().postData()));
        return r.fulfill({ contentType: 'application/json', headers: cors, body: '{"ok":true,"repo":"ada/practice","url":"https://github.com/ada/practice/commit/x"}' });
      }
      return r.fulfill({ contentType: 'application/json', headers: cors, body: linked ? '{"linked":true,"repo":"ada/practice","autoSync":true}' : '{"linked":false,"githubUser":true}' });
    });
    await acct.addInitScript(() => {
      window.LFB_REMOTE_RUNNER_URL = '';
      window.LFB_SUPABASE_URL = 'https://example.supabase.co';
      window.LFB_SUPABASE_ANON_KEY = 'public-anon-key';
      window.LFB_GITHUB_APP_SLUG = 'lfb-sync';
    });
    await acct.goto(`${BASE}#/`);
    // Signed out and no auth callback: the menu renders from config alone, supabase-js is not fetched yet.
    await acct.waitForSelector('#account button:has-text("Sign in")');
    await acct.waitForTimeout(300);
    if (acctRequests.some((u) => u.includes('supabase-js'))) throw new Error('supabase-js loaded before the Sign in click');
    // Keyboard open with ArrowDown: opens menu, focuses the first menuitem (no double-jump), and keeps focus across supabase-js lazy-load.
    await acct.focus('#account button:has-text("Sign in")');
    await acct.keyboard.press('ArrowDown');
    await acct.waitForFunction(() => document.querySelector('.account-menu button')?.textContent?.includes('Google'));
    // A disclosure, not an ARIA menu: the panel holds hints and a wizard, which role="menu" forbids.
    const semantics = await acct.evaluate(() => {
      const toggle = document.querySelector('#account .account-toggle');
      return {
        roles: document.querySelectorAll('#account [role="menu"], #account [role="menuitem"], #account [aria-haspopup]').length,
        controls: toggle?.getAttribute('aria-controls'),
        panelId: document.querySelector('#account .account-menu')?.id,
      };
    });
    if (semantics.roles || !semantics.controls || semantics.controls !== semantics.panelId) throw new Error(`account panel semantics: ${JSON.stringify(semantics)}`);
    const firstItem = await acct.evaluate(() => document.activeElement?.textContent?.trim());
    if (firstItem !== 'Continue with Google') throw new Error(`ArrowDown on Sign in should focus first item, got "${firstItem}"`);
    await acct.waitForTimeout(300);
    if (!acctRequests.some((u) => u.includes('supabase-js'))) throw new Error('opening Sign in did not load supabase-js');
    const retainedItem = await acct.evaluate(() => document.activeElement?.textContent?.trim());
    if (retainedItem !== 'Continue with Google') throw new Error(`focus lost across supabase-js load render: "${retainedItem}"`);
    await acct.keyboard.press('ArrowDown');
    if ((await acct.evaluate(() => document.activeElement?.textContent?.trim())) !== 'Continue with GitHub') throw new Error('ArrowDown did not move to second menuitem');
    await acct.keyboard.press('ArrowUp');
    if ((await acct.evaluate(() => document.activeElement?.textContent?.trim())) !== 'Continue with Google') throw new Error('ArrowUp did not move back to first menuitem');
    await acct.keyboard.press('End');
    if ((await acct.evaluate(() => document.activeElement?.textContent?.trim())) !== 'Continue with GitHub') throw new Error('End did not focus last menuitem');
    await acct.keyboard.press('Home');
    if ((await acct.evaluate(() => document.activeElement?.textContent?.trim())) !== 'Continue with Google') throw new Error('Home did not focus first menuitem');
    // Escape closes the menu and returns focus to the Sign in toggle.
    await acct.keyboard.press('Escape');
    const afterEsc = await acct.evaluate(() => ({
      hidden: document.querySelector('.account-menu')?.hidden,
      expanded: document.querySelector('#account .account-toggle')?.getAttribute('aria-expanded'),
      active: document.activeElement?.textContent?.trim(),
    }));
    if (!afterEsc.hidden || afterEsc.expanded !== 'false' || afterEsc.active !== 'Sign in') {
      throw new Error(`Escape did not close menu and restore focus: ${JSON.stringify(afterEsc)}`);
    }
    // Re-open with click, verify outside click closes and returns focus to toggle.
    await acct.click('#account button:has-text("Sign in")');
    await acct.waitForSelector('.account-menu button:has-text("Continue with Google")');
    await acct.waitForSelector('.account-menu button:has-text("Continue with GitHub")');
    if (shotsDir) await acct.screenshot({ path: `${shotsDir}/19-sign-in.png` });
    await acct.click('.page-head h1');
    const afterOutside = await acct.evaluate(() => ({
      hidden: document.querySelector('.account-menu')?.hidden,
      active: document.activeElement?.textContent?.trim(),
    }));
    if (!afterOutside.hidden || afterOutside.active !== 'Sign in') {
      throw new Error(`outside click did not close menu and restore focus: ${JSON.stringify(afterOutside)}`);
    }
    // Mobile account menu shows a dimmed backdrop and closes cleanly on backdrop click.
    await acct.setViewportSize({ width: 390, height: 844 });
    await acct.click('#account button:has-text("Sign in")');
    await acct.waitForSelector('.account-backdrop:not([hidden])');
    const mobileMenu = await acct.evaluate(() => {
      const bd = document.querySelector('.account-backdrop');
      const m = document.querySelector('.account-menu').getBoundingClientRect();
      return { bdDisplay: getComputedStyle(bd).display, left: m.left, right: m.right, top: m.top };
    });
    // Same 12 px gutter on both sides (a stray right: auto once left about 2 px on the right).
    if (mobileMenu.bdDisplay === 'none' || mobileMenu.left < 0 || mobileMenu.right > 390.5 || Math.abs(mobileMenu.left - (390 - mobileMenu.right)) > 1) {
      throw new Error(`unexpected mobile account menu/backdrop layout: ${JSON.stringify(mobileMenu)}`);
    }
    if (shotsDir) await acct.screenshot({ path: `${shotsDir}/390-account-menu.png` });
    await acct.mouse.click(195, 700);
    await acct.waitForSelector('.account-menu', { state: 'hidden' });
    if ((await acct.evaluate(() => document.activeElement?.textContent?.trim())) !== 'Sign in') {
      throw new Error('backdrop click did not restore focus to Sign in toggle');
    }
    await acct.setViewportSize({ width: 1440, height: 900 });

    signedIn = true;
    // supabase-js keeps a returning user's session here; its presence is what starts the client at page load.
    await acct.evaluate(() => localStorage.setItem('sb-example-auth-token', '{}'));
    acctRequests.length = 0;
    await acct.reload();
    await acct.waitForSelector('#account .account-name:has-text("Ada")');
    if (!acctRequests.some((u) => u.includes('supabase-js'))) throw new Error('a stored session must start supabase-js at page load');
    await acct.click('#account .account-name');
    // Not linked yet: the wizard offers GitHub's prefilled new-repository page, then the app install page.
    // Each step replaces the pressed button; keyboard focus must land on the new step, not <body>.
    await acct.focus('.account-menu button:has-text("Yes")');
    await acct.keyboard.press('Enter');
    const afterYes = await acct.evaluate(() => ({ inPanel: Boolean(document.activeElement?.closest('.account-menu')), text: document.activeElement?.textContent?.trim() }));
    if (!afterYes.inPanel || afterYes.text !== 'Connect it') throw new Error(`wizard "Yes" dropped keyboard focus: ${JSON.stringify(afterYes)}`);
    await acct.focus('.account-menu .gh-wizard .btn-link');
    await acct.keyboard.press('Enter');
    if ((await acct.evaluate(() => document.activeElement?.textContent?.trim())) !== 'Yes') throw new Error('wizard "Back" did not move focus to the first step');
    await acct.focus('.account-menu button:has-text("No, create one")');
    await acct.keyboard.press('Enter');
    if ((await acct.evaluate(() => document.activeElement?.id)) !== 'gh-vis-private') throw new Error('wizard "No, create one" did not move focus to the visibility choice');
    // Arrow keys inside the radio group must switch radios natively instead of jumping to menuitems.
    await acct.focus('#gh-vis-private');
    await acct.keyboard.press('ArrowDown');
    if (!(await acct.locator('#gh-vis-public').isChecked())) throw new Error('ArrowDown on radio group did not select Public radio');
    const createHref = await acct.locator('.account-menu a:has-text("Create it on GitHub")').getAttribute('href');
    if (!/^https:\/\/github\.com\/new\?name=leetcode-solutions&.*visibility=public/.test(createHref)) throw new Error(`create link: ${createHref}`);
    const installHref = await acct.locator('.account-menu a:has-text("Connect it")').getAttribute('href');
    if (installHref !== 'https://github.com/apps/lfb-sync/installations/new') throw new Error(`install link: ${installHref}`);
    linked = true;
    await acct.reload();
    await acct.waitForSelector('#account .account-name:has-text("Ada")');
    await acct.click('#account .account-name');
    await acct.waitForSelector('.account-menu a:has-text("ada/practice")');
    await acct.waitForSelector('.account-menu button:has-text("Sign out")');
    if (shotsDir) await acct.screenshot({ path: `${shotsDir}/21-github-sync.png` });
    // Solve without revealing: the Accepted submit is pushed on its own. Also the regression check
    // that a signed-in Submit reaches a verdict (the progress sync once threw "Illegal invocation").
    await acct.goto(`${BASE}#/problem/pair-sum-target`);
    await acct.waitForSelector('.monaco-editor', { timeout: 30000 });
    const code = await acct.evaluate(async () => (await fetch('src/js/problems/pair-sum-target/solutions/solution.js')).text());
    await acct.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code);
    await acct.click('button:has-text("Submit")');
    await acct.waitForFunction(() => /Accepted/.test(document.querySelector('.result-head')?.textContent ?? ''), null, { timeout: 30000 }).catch(async (err) => {
      throw new Error(`no Accepted; console: ${(await acct.locator('.result-head, .console-body').first().textContent().catch(() => '?')).slice(0, 300)}`);
    });
    await acct.waitForSelector('.toast:has-text("Saved to GitHub: ada/practice")', { timeout: 15000 });
    // Verify toast renders top-center under the header with click-through host.
    const toastLayout = await acct.evaluate(() => {
      const host = document.querySelector('.toast-host');
      const item = document.querySelector('.toast');
      const r = item.getBoundingClientRect();
      return {
        hostPe: getComputedStyle(host).pointerEvents,
        toastPe: getComputedStyle(item).pointerEvents,
        top: r.top,
        centerX: r.left + r.width / 2,
        vw: window.innerWidth,
      };
    });
    if (toastLayout.hostPe !== 'none' || toastLayout.toastPe !== 'auto') throw new Error(`unexpected toast pointer-events: ${JSON.stringify(toastLayout)}`);
    if (toastLayout.top < 52 || toastLayout.top > 160 || Math.abs(toastLayout.centerX - toastLayout.vw / 2) > 40) {
      throw new Error(`toast is not top-center under header: ${JSON.stringify(toastLayout)}`);
    }
    if (pushes.length !== 1 || pushes[0].problemId !== 'pair-sum-target' || pushes[0].assisted !== false || !pushes[0].code.includes('function')) throw new Error(`unexpected pushes: ${JSON.stringify(pushes).slice(0, 200)}`);

    // Sign-out asks first, closes the menu before opening the dialog, keeps everything on Cancel, and clears this user's data on confirm.
    await acct.goto(`${BASE}#/`);
    await acct.waitForSelector('#account .account-name:has-text("Ada")');
    const stored = () => acct.evaluate(() => ({ progress: JSON.parse(localStorage.getItem('lfb:progress:v1') ?? 'null'), drafts: Object.keys(localStorage).filter((k) => k.startsWith('lfb:draft:')) }));
    await acct.evaluate(() => localStorage.setItem('lfb:draft:v1:pair-sum-target:python', '# unsaved'));
    if (!(await stored()).progress?.problems?.['pair-sum-target']) throw new Error('expected local progress before sign-out');
    await acct.click('#account .account-name');
    await acct.click('.account-menu button:has-text("Sign out")');
    await acct.waitForSelector('dialog.modal[open]');
    if (!(await acct.evaluate(() => document.querySelector('.account-menu')?.hidden))) {
      throw new Error('account menu must close before opening Sign out dialog');
    }
    await expectDialog(acct, /Sign out\?[\s\S]*stays in your account[\s\S]*removed from this device/);
    if (shotsDir) await acct.screenshot({ path: `${shotsDir}/22-sign-out-confirm.png` });
    await acct.click('dialog.modal button:has-text("Cancel")');
    await acct.waitForSelector('dialog.modal', { state: 'detached' });
    if (!(await stored()).progress?.problems?.['pair-sum-target']) throw new Error('Cancel must keep local progress');
    if ((await acct.locator('#account .account-name').count()) !== 1) throw new Error('Cancel must keep the session');
    await acct.keyboard.press('Escape');
    await acct.click('#account .account-name');
    await acct.click('.account-menu button:has-text("Sign out")');
    await acct.waitForSelector('dialog.modal[open]');
    await acct.keyboard.press('Escape');
    await acct.waitForSelector('dialog.modal', { state: 'detached' });
    if (!(await stored()).progress) throw new Error('Escape must cancel');
    // Disconnecting GitHub asks too, closes the menu first, and names the repository.
    await acct.click('#account .account-name');
    await acct.click('.account-menu button:has-text("Disconnect")');
    await expectDialog(acct, /Disconnect GitHub\?[\s\S]*ada\/practice[\s\S]*Nothing in the repository is deleted/);
    if (!(await acct.evaluate(() => document.querySelector('.account-menu')?.hidden))) {
      throw new Error('account menu must close before opening Disconnect dialog');
    }
    await acct.click('dialog.modal button:has-text("Cancel")');
    await acct.waitForSelector('dialog.modal', { state: 'detached' });
    await acct.click('#account .account-name');
    await acct.click('.account-menu button:has-text("Sign out")');
    await acct.click('dialog.modal button:has-text("Sign out")');
    await acct.waitForSelector('#account button:has-text("Sign in")');
    const after = await stored();
    if (after.progress && Object.keys(after.progress.problems).length) throw new Error(`progress left on the device: ${JSON.stringify(after.progress).slice(0, 120)}`);
    if (after.drafts.length) throw new Error(`drafts left on the device: ${after.drafts}`);
    await acct.close();
  });

  await check('privacy policy: linked from the home page, uses shared shell, lists what is stored and how to delete it', async () => {
    await page.goto(`${BASE}#/`);
    await page.click('footer.site-links a:has-text("Privacy Policy")');
    await page.waitForSelector('article.legal h1');
    await expectText('article.legal', /Deleting your data/);
    await expectText('article.legal', /IP address/);
    const privacyShell = await page.evaluate(() => ({
      skipLink: Boolean(document.querySelector('a.skip-link[href="#view"]')),
      headerNav: document.querySelectorAll('.app-header .nav a').length,
      headerBack: Boolean(document.querySelector('.app-header a.btn')),
      pageHead: Boolean(document.querySelector('article.legal header.page-head h1')),
      backLink: Boolean(document.querySelector('article.legal a.back-link')),
      btnColor: getComputedStyle(document.querySelector('article.legal a.btn')).color,
      linkColor: getComputedStyle(document.querySelector('article.legal a[href^="mailto:"]')).color,
      tabLinks: document.querySelectorAll('.tab-bar a').length,
    }));
    if (!privacyShell.skipLink || privacyShell.headerNav !== 4 || !privacyShell.headerBack || !privacyShell.pageHead || !privacyShell.backLink || privacyShell.tabLinks !== 4) {
      throw new Error(`privacy.html shell incomplete: ${JSON.stringify(privacyShell)}`);
    }
    if (privacyShell.btnColor === privacyShell.linkColor) {
      throw new Error(`button inside .legal inherited link blue color (${privacyShell.btnColor})`);
    }
    await shot('20-privacy');
    await page.goto(`${BASE}#/`);
  });

  await check('unknown route shows shared .state not found block', async () => {
    await page.goto(`${BASE}#/nope`);
    await page.waitForSelector('.page .state .state-title');
    await expectText('.page .state', /Not found/);
  });

  await check('unknown problem id shows not found; a problem module that fails to load shows could not load', async () => {
    await page.goto(`${BASE}#/problem/no-such-problem`);
    await page.waitForSelector('.page .state .state-title');
    await expectText('.page .state', /Not found/);
    // A module that throws while evaluating: the import rejects like a failed download, without the
    // browser's own network-error log, so the zero-console-errors check below still covers our code.
    const broken = '**/problems/two-wall-tank/problem.js';
    await page.route(broken, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: 'throw new Error("simulated load failure");' }));
    try {
      await page.goto(`${BASE}#/problem/two-wall-tank`);
      await page.waitForSelector('.page .state.state-error .state-title');
      await expectText('.page .state.state-error', /Could not load/);
    } finally {
      await page.unroute(broken);
    }
  });

  await check('a view module that fails to load shows the could-not-load page, with a way back', async () => {
    // Throws while evaluating, so the import rejects without the browser's own network-error log.
    const broken = '**/ui/views/path.js';
    await page.route(broken, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: 'throw new Error("simulated view failure");' }));
    try {
      await page.goto(`${BASE}#/path`);
      await page.waitForSelector('.page .state.state-error .state-title');
      await expectText('.page .state.state-error', /Could not load this page\. Check your connection and reload\./);
    } finally {
      await page.unroute(broken);
    }
    await page.click('.page .state a:has-text("Back to problems")');
    await page.waitForSelector('.problem-table tbody tr a.problem-link');
  });

  await check('fast navigation dashboard, problem, back, problem leaves exactly one editor and one workspace', async () => {
    await page.goto(`${BASE}#/`);
    await page.waitForSelector('.problem-table tbody tr a.problem-link');
    // Hash changes a few ms apart: views load asynchronously, so a stale load must not render over the newer one.
    await page.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      location.hash = '#/problem/pair-sum-target';
      await wait(15);
      history.back();
      await wait(15);
      location.hash = '#/problem/pair-sum-target';
    });
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForTimeout(1500);
    const { editors, workspaces, hash } = await page.evaluate(() => ({ editors: document.querySelectorAll('.monaco-editor').length, workspaces: document.querySelectorAll('.problem-title').length, hash: location.hash }));
    if (editors !== 1 || workspaces !== 1) throw new Error(`expected one editor and one workspace, got ${editors} and ${workspaces}`);
    if (hash !== '#/problem/pair-sum-target') throw new Error(`unexpected route ${hash}`);
    // And back out again: the dashboard returns with the editor gone.
    await page.evaluate(() => history.back());
    await page.waitForSelector('.problem-table tbody tr a.problem-link');
    if (await page.locator('.monaco-editor').count()) throw new Error('editor left behind after leaving the workspace');
  });

  await check('zero console errors across the whole session', async () => {
    if (errors.length) throw new Error(errors.join(' | '));
  });
  console.log('\nAll smoke checks passed.');
} catch {
  process.exitCode = 1;
  if (errors.length) console.log('Console errors:\n' + errors.map((e) => `  ${e}`).join('\n'));
} finally {
  await browser.close();
  server.close();
}
