// Every shipped solution, in every language, must pass all 15 of its problem's cases.
// "Reveal Solution" shows these strings to users, so an unverified one is a bug we ship.
// Python and Java run only where python3 / javac exist (CI has both); JavaScript always runs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { availableProblems } from '../src/js/problems/index.js';
import { buildSuite, deepEqual } from '../src/js/engine/harness.js';

const has = (cmd, args) => spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;
const HAS_PYTHON = has('python3', ['--version']);
const HAS_JAVA = has('javac', ['-version']);
const HARNESS = new URL('../scripts/verify/Harness.java', import.meta.url).pathname;

function check(problem, lang, actuals) {
  const suite = buildSuite(problem);
  assert.equal(actuals.length, suite.length, `${problem.id} ${lang}: wrong number of results`);
  suite.forEach((tc, i) => assert.ok(deepEqual(actuals[i], tc.expected), `${problem.id} ${lang}: case ${tc.id} failed`));
}

for (const problem of availableProblems()) {
  const suite = buildSuite(problem);

  test(`${problem.id}: JavaScript solution passes all 15 cases`, () => {
    const fn = new Function(`${problem.solutions.javascript}\nreturn ${problem.signatures.javascript.entry};`)();
    check(problem, 'javascript', suite.map((tc) => fn(...structuredClone(tc.args))));
  });

  test(`${problem.id}: Python solution passes all 15 cases`, { skip: !HAS_PYTHON && 'python3 not installed' }, () => {
    const dir = mkdtempSync(join(tmpdir(), 'lfb-py-'));
    writeFileSync(join(dir, 'solution.py'), problem.solutions.python);
    writeFileSync(join(dir, 'cases.json'), JSON.stringify(suite.map((tc) => tc.args)));
    const runner = `import json, sys
sys.path.insert(0, ${JSON.stringify(dir)})
import solution
fn = getattr(solution, ${JSON.stringify(problem.signatures.python.entry)})
for args in json.load(open(${JSON.stringify(join(dir, 'cases.json'))})):
    print(json.dumps(fn(*args)))
`;
    const out = execFileSync('python3', ['-I', '-c', runner], { maxBuffer: 1 << 28, encoding: 'utf8' });
    check(problem, 'python', out.trim().split('\n').map((l) => JSON.parse(l)));
  });

  test(`${problem.id}: Java solution passes all 15 cases`, { skip: !HAS_JAVA && 'javac not installed' }, () => {
    const dir = mkdtempSync(join(tmpdir(), 'lfb-java-'));
    writeFileSync(join(dir, 'Solution.java'), problem.solutions.java);
    copyFileSync(HARNESS, join(dir, 'Harness.java'));
    execFileSync('javac', ['-d', dir, join(dir, 'Solution.java'), join(dir, 'Harness.java')], { stdio: 'pipe' });
    const out = execFileSync('java', ['-Xss64m', '-cp', dir, 'Harness', problem.signatures.java.entry], {
      input: JSON.stringify(suite.map((tc) => tc.args)),
      maxBuffer: 1 << 28,
      encoding: 'utf8',
    });
    check(problem, 'java', out.trim().split('\n').map((l) => JSON.parse(l)));
  });
}
