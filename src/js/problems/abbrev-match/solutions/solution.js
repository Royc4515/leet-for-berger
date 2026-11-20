/**
 * O(n + m) time, O(1) space: two pointers, and a number moves the word pointer without reading
 * the letters it skips (a number can be 10^9, so never expand it).
 * @param {string} word
 * @param {string} abbr
 * @return {boolean}
 */
var matchesAbbreviation = function (word, abbr) {
  let i = 0;
  let j = 0;
  const n = word.length;
  const m = abbr.length;
  while (i < n && j < m) {
    const c = abbr[j];
    if (c >= '0' && c <= '9') {
      // A number may not start with 0, which also rules out the number 0.
      if (c === '0') return false;
      let num = 0;
      while (j < m && abbr[j] >= '0' && abbr[j] <= '9') {
        num = num * 10 + (abbr.charCodeAt(j) - 48);
        j++;
      }
      i += num;
    } else {
      if (word[i] !== c) return false;
      i++;
      j++;
    }
  }
  // Both strings must end together. A skip that overshoots leaves i past the end of word.
  return i === n && j === m;
};
