/**
 * O(n) time, O(1) space: tally all 26 lowercase letters, then scan left to right for the first
 * letter whose total count is 1.
 * @param {string} s
 * @return {number}
 */
var firstLoneChar = function (s) {
  const counts = new Int32Array(26);
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
  }
  for (let i = 0; i < s.length; i++) {
    if (counts[s.charCodeAt(i) - 97] === 1) return i;
  }
  return -1;
};
