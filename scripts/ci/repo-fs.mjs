/**
 * The repository as scripts/ci/deps.mjs reads it: file contents, what a path is, and every tracked
 * file (a checkout's files, without build output or dependencies).
 */
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {string} [root] repository root (default: this checkout)
 * @returns {{ read: (path: string) => string|null, kind: (path: string) => 'file'|'dir'|null, files: () => string[] }}
 */
export function repoFs(root = fileURLToPath(new URL('../../', import.meta.url))) {
  let all = null;
  return {
    read: (p) => {
      try {
        return readFileSync(join(root, p), 'utf8');
      } catch {
        return null;
      }
    },
    kind: (p) => {
      try {
        return statSync(join(root, p)).isDirectory() ? 'dir' : 'file';
      } catch {
        return null;
      }
    },
    files: () => (all ??= execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)),
  };
}
