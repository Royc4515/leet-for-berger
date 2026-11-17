// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1400-1499/1456.Maximum%20Number%20of%20Vowels%20in%20a%20Substring%20of%20Given%20Length/Solution.ts
/**
 * O(n) time - sliding the window adds one character and drops one, so the count updates in O(1).
 * @param {string} s
 * @param {number} k
 * @return {number}
 */
function maxVowels(s, k) {
  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
  let cnt = 0;
  for (let i = 0; i < k; i++) {
    if (vowels.has(s[i])) cnt++;
  }
  let ans = cnt;
  for (let i = k; i < s.length; i++) {
    if (vowels.has(s[i])) cnt++;
    if (vowels.has(s[i - k])) cnt--;
    ans = Math.max(ans, cnt);
  }
  return ans;
}
