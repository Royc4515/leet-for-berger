/**
 * O(n) time, O(1) space. Rearrangements have identical letter counts, so add for s and subtract
 * for t in one table and require all 26 counters to end at zero.
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function sameLetters(s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  return count.every((c) => c === 0);
}
