/**
 * O(n) time - the most recently opened bracket must close first, so keep openers on a stack.
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch in pairs) {
      // pop() on an empty stack gives undefined, which never matches: a closer with nothing open.
      if (stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  // Leftover openers were never closed.
  return stack.length === 0;
}
