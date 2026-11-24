/** Module loader hooks for scripts/ci/trace/preload.mjs: records every repository module loaded. */
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let who = 'unknown';
let out = null;
let root = '';

/** @param {{ who: string, out: string, root: string }} data */
export async function initialize(data) {
  ({ who, out, root } = data);
}

/** Records the module, then loads it unchanged. */
export async function load(url, context, next) {
  if (url.startsWith('file://')) {
    const path = fileURLToPath(url);
    if (path.startsWith(root) && !path.includes('/node_modules/')) {
      try {
        appendFileSync(out, `${who}\t${path.slice(root.length)}\n`);
      } catch {
        // Tracing must never change what a test sees.
      }
    }
  }
  return next(url, context);
}
