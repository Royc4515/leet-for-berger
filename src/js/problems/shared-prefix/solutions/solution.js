// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0014.Longest%20Common%20Prefix/Solution.js
/**
 * O(total length) - vertical scan: column i of every word, stopping at the first mismatch.
 * @param {string[]} strs
 * @return {string}
 */
function longestCommonPrefix(strs) {
  const first = strs[0];
  for (let j = 0; j < first.length; j++) {
    for (let i = 1; i < strs.length; i++) {
      // A shorter word reads as undefined past its end, which never equals a letter.
      if (strs[i][j] !== first[j]) return first.substring(0, j);
    }
  }
  return first;
}
