// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0670.Maximum%20Swap/Solution.ts
/**
 * O(d) time - improve the leftmost digit that has a larger digit somewhere to its right.
 * @param {number} num
 * @return {number}
 */
function maximumSwap(num) {
  const s = String(num).split('');
  const n = s.length;
  // d[i] = index of the largest digit in s[i..], the rightmost one on ties.
  const d = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 2; i >= 0; --i) {
    // '<=' keeps the later copy: swapping with the last 9 of 1993 gives 9913, not 9193.
    if (s[i] <= s[d[i + 1]]) d[i] = d[i + 1];
  }
  for (let i = 0; i < n; ++i) {
    const j = d[i];
    if (s[i] < s[j]) {
      [s[i], s[j]] = [s[j], s[i]];
      break;
    }
  }
  return Number(s.join(''));
}
