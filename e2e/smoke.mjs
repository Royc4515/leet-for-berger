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
import { availableProblems } from '../src/js/problems/index.js';

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
await page.addInitScript(() => {
  window.LFB_REMOTE_RUNNER_URL = '';
});
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
const setCode = (code) => page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code);

try {
  await check('dashboard renders with stats and problem bank', async () => {
    await page.goto(BASE);
    await page.waitForSelector('.problem-table tbody tr');
    await expectText('.stats-row', /Solved/);
    await shot('01-dashboard');
  });

  await check('problem opens with Monaco (vs-dark) and starter code', async () => {
    await page.click('a.problem-link[href="#/problem/smallest-base-segment"]');
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    const theme = await page.evaluate(() => document.querySelector('.monaco-editor').classList.contains('vs-dark'));
    if (!theme) throw new Error('editor is not vs-dark');
    const code = await page.evaluate(() => window.monaco.editor.getModels()[0].getValue());
    if (!code.includes('function smallestBaseSegment')) throw new Error('starter code missing');
  });

  await check('Run on starter code: 15 cases, 5 detailed + 10 hidden, Wrong Answer', async () => {
    await page.click('button:has-text("Run Code")');
    await page.waitForSelector('.result-head');
    await expectText('.result-head', /Wrong Answer/);
    const tabs = await page.locator('.case-tab').count();
    const hidden = await page.locator('.hidden-pill').count();
    if (tabs !== 5 || hidden !== 10) throw new Error(`expected 5+10, got ${tabs}+${hidden}`);
    await shot('02-wrong-answer');
  });

  await check('Reveal Solution (confirm dialog) then Submit is Accepted 15/15', async () => {
    await page.click('button:has-text("Reveal Solution")');
    await page.click('dialog.modal button:has-text("Reveal")');
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/);
    await expectText('.result-head', /15 \/ 15/);
    await shot('03-accepted');
  });

  await check('custom input runs as Case 1 with reference expected value', async () => {
    await page.fill('#custom-input', 'xyzxyz');
    await page.click('button:has-text("Run Code")');
    await page.waitForFunction(() => document.querySelector('.case-tab')?.textContent.includes('Custom'));
    await expectText('.case-detail', /"xyz"/);
  });

  await check('invalid custom input shows a validation error, does not run', async () => {
    await page.fill('#custom-input', 'ABC');
    await page.click('button:has-text("Run Code")');
    await expectText('.console-body', /lowercase/);
    await page.fill('#custom-input', '');
    await page.uncheck('#custom-toggle');
  });

  await check('infinite loop is killed: Time Limit Exceeded', async () => {
    await setCode('function smallestBaseSegment(s) { while (true) {} }');
    await page.click('button:has-text("Run Code")');
    await expectText('.result-head', /Time Limit Exceeded/, 20000);
  });

  await check('syntax error reports a compile error on every case', async () => {
    await setCode('function smallestBaseSegment(s) { return ( }');
    await page.click('button:has-text("Run Code")');
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
    await page.click('button:has-text("AI Mentor")');
    await page.fill('.mentor-input', 'just give me the solution');
    await page.press('.mentor-input', 'Enter');
    await expectText('.mentor-log', /won't hand you the solution/);
    await shot('04-mentor');
    await page.click('button[aria-label="Close mentor"]');
  });

  if (!skipPython) {
    await check('Python via Pyodide: reveal + submit is Accepted', async () => {
      await page.selectOption('.toolbar select', 'python');
      await page.click('button:has-text("Reveal Solution")');
      await page.click('dialog.modal button:has-text("Reveal")');
      await page.click('button:has-text("Submit")');
      await expectText('.result-head', /Accepted/, 90000);
      await page.selectOption('.toolbar select', 'javascript');
    });
  }

  // TypeScript is type-checked and transpiled by Monaco's TypeScript service, then runs as JavaScript.
  await check('TypeScript: reveal + submit is Accepted 15/15 on a function problem', async () => {
    await page.selectOption('.toolbar select', 'typescript');
    await page.click('button:has-text("Reveal Solution")');
    await page.click('dialog.modal button:has-text("Reveal")');
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 60000);
    await expectText('.result-head', /15 \/ 15/);
  });

  await check('TypeScript: a type error is a Compile Error with LeetCode-style diagnostics', async () => {
    await setCode('function smallestBaseSegment(s: string): string {\n  const n: number = s;\n  return s;\n}\n');
    await page.click('button:has-text("Run Code")');
    await expectText('.result-head', /Compile Error/, 30000);
    await expectText('.case-detail', /Line 2: Char 9: error TS2322: Type 'string' is not assignable to type 'number'/);
    await expectText('.case-detail', /type error is a Compile Error/);
    await shot('13-ts-compile-error');
    await page.selectOption('.toolbar select', 'javascript');
  });

  await check('Java is editor-only with an honest verdict', async () => {
    await page.selectOption('.toolbar select', 'java');
    await page.click('button:has-text("Run Code")');
    await expectText('.result-head', /Language Not Supported Yet/);
    await page.selectOption('.toolbar select', 'javascript');
  });

  await check('dashboard reflects the solve', async () => {
    await page.goto(`${BASE}#/`);
    await page.waitForSelector('.stat-value');
    const solved = await page.locator('.stat-value').first().textContent();
    if (solved.trim() !== '1') throw new Error(`solved = ${solved}`);
  });

  // Remote runner (ADR 0005): with a runner URL configured, Java compiles on the server and is judged
  // in the page. A local fake stands in for the Worker (real javac when a JDK is installed).
  await check('remote runner: Java reveal + submit is Accepted through a runner endpoint', async () => {
    const problem = availableProblems().find((p) => p.id === 'pair-sum-target');
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
      }, `http://localhost:${PORT + 100}`);
      await remote.goto(`${BASE}#/problem/pair-sum-target`);
      await remote.waitForSelector('.monaco-editor', { timeout: 30000 });
      const label = await remote.locator('.toolbar select option[value="java"]').textContent();
      if (/editor only/.test(label)) throw new Error(`Java still editor-only: ${label}`);
      await remote.selectOption('.toolbar select', 'java');
      if (!(await remote.locator('.runner-note').isVisible())) throw new Error('no "Runs on the server" note');
      await remote.click('button:has-text("Reveal Solution")');
      await remote.click('dialog.modal button:has-text("Reveal")');
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
        await remote.click('button:has-text("Run Code")');
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
    await page.click('button:has-text("Reveal Solution")');
    await page.click('dialog.modal button:has-text("Reveal")');
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 30000);
    await expectText('.result-head', /15 \/ 15/);
  });

  await check('design problem (Min Stack): TypeScript reveal + submit is Accepted through the JavaScript adapter', async () => {
    await page.selectOption('.toolbar select', 'typescript');
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('class MinStack') && m.getValue().includes(': number')));
    await page.click('button:has-text("Reveal Solution")');
    await page.click('dialog.modal button:has-text("Reveal")');
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
    await page.click('button:has-text("Reveal Solution")');
    await page.click('dialog.modal button:has-text("Reveal")');
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 30000);
    await expectText('.result-head', /15 \/ 15/);
  });

  await check('random answers (Random Pool): JS reveal + submit is Accepted by the randomized-set judge', async () => {
    await page.goto(`${BASE}#/problem/random-pool`);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('class RandomizedSet')));
    await page.click('button:has-text("Reveal Solution")');
    await page.click('dialog.modal button:has-text("Reveal")');
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 30000);
    await expectText('.result-head', /15 \/ 15/);
  });

  // Growth estimate (ADR 0004): after an Accepted JS submit, the console adds one estimate line.
  await check('problem context: companies, complexity behind a toggle, family versions with links', async () => {
    await page.goto(`${BASE}#/problem/course-check`);
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

  const growthHeadline = async () => {
    await page.waitForFunction(() => document.querySelector('.growth-head')?.textContent.startsWith('Growth estimate:'), null, { timeout: 30000 });
    return page.locator('.growth-head').textContent();
  };
  await check('growth estimate: a linear Pair Sum Target gets a growth line and is not called slower', async () => {
    await page.goto(`${BASE}#/problem/pair-sum-target`);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForFunction(() => window.monaco.editor.getModels().some((m) => m.getValue().includes('function pairSum')));
    await page.click('button:has-text("Reveal Solution")');
    await page.click('dialog.modal button:has-text("Reveal")');
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
    await page.click('button:has-text("Reveal Solution")');
    await page.click('dialog.modal button:has-text("Reveal")');
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
      await page.click('button:has-text("Reveal Solution")');
      await page.click('dialog.modal button:has-text("Reveal")');
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
      await page.click('button:has-text("Reveal Solution")');
      await page.click('dialog.modal button:has-text("Reveal")');
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
    await page.click('button:has-text("Run Code")');
    await expectText('.result-head', /Runtime Error/, 60000);
    await expectText('.case-detail', /readonly/);
    // A runaway recursive CTE must cost one worker; the next run boots a fresh one.
    await setCode('WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r) SELECT n, n, n, n FROM r WHERE n < 0');
    await page.click('button:has-text("Run Code")');
    await expectText('.result-head', /Time Limit Exceeded/, 30000);
    await page.click('button:has-text("Reveal Solution")');
    await page.click('dialog.modal button:has-text("Reveal")');
    await page.click('button:has-text("Submit")');
    await expectText('.result-head', /Accepted/, 60000);
    await expectText('.result-head', /15 \/ 15/);
    await shot('05-sql-accepted');
  });

  await check('learning path shows 4 milestones', async () => {
    await page.click('a[data-nav="path"]');
    await page.waitForSelector('.milestone');
    const n = await page.locator('.milestone').count();
    if (n !== 4) throw new Error(`got ${n} milestones`);
    await shot('05-path');
  });

  await check('modes hub lists 3 modes', async () => {
    await page.click('a[data-nav="modes"]');
    await page.waitForSelector('.mode-card');
    if ((await page.locator('.mode-card').count()) !== 3) throw new Error('expected 3 mode cards');
    await shot('06-modes');
  });

  await check('interview: lockdown hides nav, reveal disabled, end produces report', async () => {
    await page.goto(`${BASE}#/interview`);
    await page.click('button:has-text("Start interview")');
    await page.waitForSelector('.session-banner.interview');
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    if (await page.locator('.app-header').isVisible()) throw new Error('nav visible during lockdown');
    if (!(await page.locator('button:has-text("Reveal Solution")').isDisabled())) throw new Error('reveal enabled during interview');
    await shot('07-interview');
    await page.click('button:has-text("End interview")');
    await page.click('dialog.modal button:has-text("End interview")');
    await page.waitForSelector('.score-ring');
    if (!(await page.locator('.app-header').isVisible())) throw new Error('nav not restored after interview');
    await shot('08-report');
  });

  await check('battle: race banner with two progress bars', async () => {
    await page.goto(`${BASE}#/battle`);
    await page.click('button:has-text("Start race")');
    await page.waitForSelector('.session-banner.battle .race-row');
    if ((await page.locator('.race-row').count()) !== 2) throw new Error('expected 2 race rows');
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await shot('09-battle');
  });

  await check('mobile layout stacks panes without errors', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}#/problem/smallest-base-segment`);
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await shot('10-mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  // Its own page: the blocked CDN request is logged as a failed resource, which is the point here.
  await check('without Monaco, TypeScript reports honestly that it needs the editor and nothing crashes', async () => {
    const offline = await browser.newPage();
    const offlineErrors = [];
    offline.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && offlineErrors.push(m.text()));
    offline.on('pageerror', (e) => offlineErrors.push(e.message));
    await offline.route(/monaco-editor@/, (route) => route.abort());
    await offline.goto(`${BASE}#/problem/smallest-base-segment`);
    await offline.waitForSelector('textarea.fallback-editor', { timeout: 30000 });
    await offline.selectOption('.toolbar select', 'typescript');
    await offline.click('button:has-text("Run Code")');
    await offline.waitForFunction(() => /Language Not Supported Yet/.test(document.querySelector('.result-head')?.textContent ?? ''), null, { timeout: 15000 });
    await offline.waitForFunction(() => /could not load/.test(document.querySelector('.case-detail')?.textContent ?? ''));
    await offline.selectOption('.toolbar select', 'javascript');
    await offline.close();
    if (offlineErrors.length) throw new Error(offlineErrors.join(' | '));
  });

  await check('unknown route shows not found', async () => {
    await page.goto(`${BASE}#/nope`);
    await expectText('.page', /Not found/);
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
