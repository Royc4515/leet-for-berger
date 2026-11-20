// O(n) time, O(1) space: every counted substring straddles one border between two runs, and that
// border contributes min(left run, right run).
function countMatchingBlocks(s: string): number {
  let prev = 0;
  let cur = 1;
  let total = 0;
  for (let i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1]) {
      cur++;
    } else {
      total += Math.min(prev, cur);
      prev = cur;
      cur = 1;
    }
  }
  // The last run has no character after it to trigger the update above.
  return total + Math.min(prev, cur);
}
