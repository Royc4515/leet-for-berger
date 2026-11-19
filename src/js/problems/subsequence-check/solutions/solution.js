// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0392.Is%20Subsequence/Solution.ts
/**
 * O(|s| + |t|) time, O(1) space. Matching each letter of s at its earliest spot in t
 * leaves the most room for the rest, so the greedy scan never needs to backtrack.
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isSubsequence(s, t) {
  let i = 0;
  for (let j = 0; i < s.length && j < t.length; j++) {
    if (s[i] === t[j]) i++;
  }
  return i === s.length;
}
