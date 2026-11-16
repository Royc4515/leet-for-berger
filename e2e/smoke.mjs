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

const args = new Set(process.argv.slice(2));
const skipPython = args.has('--no-python');
const shotsDir = [...args].find((a) => a.startsWith('--shots='))?.split('=')[1];
const PORT = 5199;
const BASE = `http://localhost:${PORT}/`;

const server = await startServer(PORT);
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
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
