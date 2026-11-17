// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0046.Permutations/Solution.ts
// O(n! * n) time - fill positions left to right with any unused value. Sorting first and trying
// values in ascending order emits the permutations in lexicographic order.
function permute(nums: number[]): number[][] {
  // The default sort compares as strings, so a numeric comparator is required.
  const a = [...nums].sort((x, y) => x - y);
  const n = a.length;
  const ans: number[][] = [];
  const vis: boolean[] = Array(n).fill(false);
  const t: number[] = Array(n).fill(0);
  const dfs = (i: number) => {
    if (i === n) {
      ans.push(t.slice());
      return;
    }
    for (let j = 0; j < n; ++j) {
      if (!vis[j]) {
        vis[j] = true;
        t[i] = a[j];
        dfs(i + 1);
        // Release the value so sibling branches can place it later.
        vis[j] = false;
      }
    }
  };
  dfs(0);
  return ans;
}
