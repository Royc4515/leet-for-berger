// O(n) time, O(1) space: the counter is the number of brackets open right now.
function maxParenDepth(s: string): number {
  let depth = 0;
  let best = 0;
  for (const ch of s) {
    if (ch === '(') {
      depth++;
      // A new peak can only appear right after an opening bracket.
      if (depth > best) best = depth;
    } else if (ch === ')') {
      depth--;
    }
  }
  return best;
}
