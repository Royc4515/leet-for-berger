// O(n) time, O(1) space: tally all 26 lowercase letters, then return the first index with count 1.
function firstLoneChar(s: string): number {
  const counts = new Int32Array(26);
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
  }
  for (let i = 0; i < s.length; i++) {
    if (counts[s.charCodeAt(i) - 97] === 1) return i;
  }
  return -1;
}
