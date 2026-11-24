#!/usr/bin/env node
/**
 * Runs the unit tests this branch's changes reach (`npm run test:affected`): what differs from
 * main (committed, staged, unstaged and new files), selected as CI selects them
 * (scripts/ci/affected.mjs). `npm test` still runs every test.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const git = (...a) => {
  try {
    return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    return [];
  }
};
const base = git('merge-base', 'HEAD', 'origin/main')[0] ?? git('merge-base', 'HEAD', 'main')[0] ?? 'HEAD';
const changed = [...new Set([...git('diff', '--name-only', base), ...git('ls-files', '--others', '--exclude-standard')])];
const pick = spawnSync(process.execPath, [fileURLToPath(new URL('./affected.mjs', import.meta.url))], { cwd: ROOT, input: changed.join('\n'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] });
const tests = (pick.stdout.match(/^tests=(.*)$/m)?.[1] ?? '').split(' ').filter(Boolean);
if (!tests.length) {
  console.log('No unit test reaches these changes.');
  process.exit(pick.status ?? 0);
}
const run = spawnSync(process.execPath, ['--test', ...tests], { cwd: ROOT, stdio: 'inherit' });
process.exit(run.status ?? 1);
