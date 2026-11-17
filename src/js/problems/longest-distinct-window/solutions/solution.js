// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0003.Longest%20Substring%20Without%20Repeating%20Characters/Solution.js
/**
 * O(n) time - each character enters the window once and leaves it at most once.
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // Input is ASCII, so a fixed table replaces a hash map.
  const cnt = new Int32Array(128);
  let ans = 0;
  for (let l = 0, r = 0; r < s.length; r++) {
    const c = s.charCodeAt(r);
    cnt[c]++;
    // Shrink from the left until the new character is no longer duplicated.
    while (cnt[c] > 1) cnt[s.charCodeAt(l++)]--;
    ans = Math.max(ans, r - l + 1);
  }
  return ans;
}
