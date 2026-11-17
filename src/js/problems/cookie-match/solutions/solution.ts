// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0455.Assign%20Cookies/Solution.ts
// O(n log n + m log m) time - a cookie too small for the least greedy child is useless to all.
function findContentChildren(g: number[], s: number[]): number {
  // Copies: the caller's arrays are not ours to reorder.
  const kids = [...g].sort((a, b) => a - b);
  const cookies = [...s].sort((a, b) => a - b);
  const m = kids.length;
  const n = cookies.length;
  for (let i = 0, j = 0; i < m; ++i) {
    // Skip cookies that cannot satisfy this child; they cannot satisfy anyone greedier either.
    while (j < n && cookies[j] < kids[i]) ++j;
    if (j++ >= n) return i;
  }
  return m;
}
