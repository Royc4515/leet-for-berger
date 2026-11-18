/**
 * Case protocol of the native test programs (Java, C, C++, Go, C#), shared by the CI verifier and
 * the remote runner. Pure module: no DOM, no Node APIs.
 *
 *   stderr: CASE_MARK before each case starts. What the program writes to stderr after the k-th mark
 *           belongs to case k (a stack trace, the user's debug prints); before the first mark is startup.
 *   stdout: after each case, RESULT_MARK then the case's JSON result and a newline, flushed. Other
 *           stdout lines are the user's own prints, attributed to the case they precede.
 *
 * A case with a CASE_MARK but no result is the one that crashed or ran out of time, so a verdict
 * names the right case even though all 15 run in one process.
 */

// U+001E (record separator) never appears in JSON output and is unlikely in a user's prints.
// The leading newline puts the mark at the start of a line even after a print without one.
export const CASE_MARK = '\n\u001e\n';
export const RESULT_MARK = '\n\u001e';

/**
 * @typedef {Object} ProgramOutput
 * @property {string[]} results  raw JSON text of each finished case, in order
 * @property {string[]} stdout   the user's stdout per finished case (results.length entries), plus one
 *                               more entry for the unfinished case when the program stopped mid-case
 * @property {string} startup    stderr written before the first case
 * @property {string[]} stderr   stderr per started case
 * @property {number} started    cases that started (CASE_MARK count)
 */

/**
 * Splits a program's output into per-case parts.
 * @param {string} stdout
 * @param {string} [stderr]
 * @returns {ProgramOutput}
 */
export function splitOutput(stdout, stderr = '') {
  const results = [];
  const prints = [];
  let pending = [];
  const lines = stdout.split('\n');
  for (const [i, line] of lines.entries()) {
    if (line.startsWith('\u001e')) {
      // The mark's own leading newline leaves one empty line after a print that ended with a newline.
      if (pending.length && pending[pending.length - 1] === '') pending.pop();
      results.push(line.slice(1));
      prints.push(pending.join('\n'));
      pending = [];
    } else if (!(i === lines.length - 1 && line === '')) {
      pending.push(line);
    }
  }
  const tail = pending.join('\n').replace(/\n+$/, '');
  if (tail) prints.push(tail);

  const parts = stderr.split(CASE_MARK);
  return {
    results,
    stdout: prints,
    startup: parts[0],
    stderr: parts.slice(1),
    started: parts.length - 1,
  };
}
