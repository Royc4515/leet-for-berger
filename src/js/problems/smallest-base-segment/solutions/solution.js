/**
 * O(n) time, O(n) space - KMP prefix function.
 * @param {string} s
 * @return {string}
 */
function smallestBaseSegment(s) {
  const n = s.length;
  const pi = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    let k = pi[i - 1];
    // Fall back through shorter borders until the next char can extend one.
    while (k > 0 && s[i] !== s[k]) k = pi[k - 1];
    if (s[i] === s[k]) k++;
    pi[i] = k;
  }
  const period = n - pi[n - 1];
  // A period only builds s from whole copies when it divides n ("ababa" -> itself).
  return n % period === 0 ? s.slice(0, period) : s;
}
