// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0017.Letter%20Combinations%20of%20a%20Phone%20Number/Solution.js
/**
 * O(4^n * n) time - extend every partial string by each letter of the next digit.
 * @param {string} digits
 * @return {string[]}
 */
function letterCombinations(digits) {
  // Without this check the loop would return [""] for no digits.
  if (digits.length === 0) return [];
  const d = ['abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'];
  let ans = [''];
  for (const i of digits) {
    const s = d[+i - 2];
    const t = [];
    // Prefixes outer, letters inner: the result stays in lexicographic order.
    for (const a of ans) {
      for (const b of s) t.push(a + b);
    }
    ans = t;
  }
  return ans;
}
