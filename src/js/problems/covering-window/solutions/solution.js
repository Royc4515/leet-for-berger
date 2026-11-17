// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0076.Minimum%20Window%20Substring/Solution.ts
/**
 * O(m + n) time - grow right until t is covered, then shrink left while it stays covered.
 * @param {string} s
 * @param {string} t
 * @return {string}
 */
function minWindow(s, t) {
  const need = new Int32Array(128);
  const window = new Int32Array(128);
  for (let i = 0; i < t.length; i++) need[t.charCodeAt(i)]++;
  const m = s.length;
  const n = t.length;
  // cnt counts window characters that fill a still-needed slot of t; cnt === n means covered.
  let k = -1;
  let mi = m + 1;
  let cnt = 0;
  for (let l = 0, r = 0; r < m; r++) {
    let c = s.charCodeAt(r);
    if (++window[c] <= need[c]) cnt++;
    while (cnt === n) {
      // Strictly shorter only: the first window of the minimum length is the leftmost.
      if (r - l + 1 < mi) {
        mi = r - l + 1;
        k = l;
      }
      c = s.charCodeAt(l);
      if (window[c] <= need[c]) cnt--;
      window[c]--;
      l++;
    }
  }
  return k < 0 ? '' : s.substring(k, k + mi);
}
