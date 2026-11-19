// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0783.Minimum%20Distance%20Between%20BST%20Nodes/Solution.ts
// O(n) time, O(h) space: in-order visits a BST in ascending order, and in a sorted list the
// closest pair is always two neighbors, so compare each value with the one visited before it.
function minGap(root: TreeNode | null): number {
  // -Infinity as "no previous value" makes the first difference infinite, so it can never win.
  let ans = Infinity;
  let pre = -Infinity;
  const dfs = (node: TreeNode | null): void => {
    if (!node) return;
    dfs(node.left);
    ans = Math.min(ans, node.val - pre);
    pre = node.val;
    dfs(node.right);
  };
  dfs(root);
  return ans;
}
