// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0072.Edit%20Distance/Solution.ts
// O(m * n) time, O(n) space: one DP row over prefixes of word2 per letter of word1.
function minDistance(word1: string, word2: string): number {
  const n = word2.length;
  let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= word1.length; i++) {
    const cur: number[] = new Array(n + 1);
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      // Replace, delete from word1, insert into word1.
      cur[j] = word1[i - 1] === word2[j - 1] ? prev[j - 1] : Math.min(prev[j - 1], prev[j], cur[j - 1]) + 1;
    }
    prev = cur;
  }
  return prev[n];
}
