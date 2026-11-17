// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0078.Subsets/Solution.ts
/**
 * O(2^n * n) time - depth-first search over sorted values. Recording each partial subset on
 * entry, before it is extended, puts every prefix ahead of its extensions: lexicographic order.
 * @param {number[]} nums
 * @return {number[][]}
 */
function subsets(nums) {
  // The default sort compares as strings, so a numeric comparator is required.
  const a = [...nums].sort((x, y) => x - y);
  const ans = [];
  const t = [];
  const dfs = (start) => {
    ans.push(t.slice());
    for (let i = start; i < a.length; i++) {
      t.push(a[i]);
      dfs(i + 1);
      t.pop();
    }
  };
  dfs(0);
  return ans;
}
