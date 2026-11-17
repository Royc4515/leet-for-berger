// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0187.Repeated%20DNA%20Sequences/Solution.ts
// O(n) windows (each slice is 10 characters), then a sort of the repeated ones.
function repeatedWindows(s: string): string[] {
  const cnt: Map<string, number> = new Map();
  const ans: string[] = [];
  for (let i = 0; i + 10 <= s.length; i++) {
    const t = s.slice(i, i + 10);
    const c = (cnt.get(t) ?? 0) + 1;
    cnt.set(t, c);
    // Report on the second sighting only, so a window seen three times is listed once.
    if (c === 2) ans.push(t);
  }
  // The default sort compares UTF-16 code units, which for these letters is alphabetical order.
  return ans.sort();
}
