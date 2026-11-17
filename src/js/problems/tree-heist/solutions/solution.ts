// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0337.House%20Robber%20III/Solution.ts
// O(n) time, O(h) stack. Each node returns [taken, skipped] totals for its subtree, so no
// subtree is ever solved twice.
function rob(root: TreeNode | null): number {
  const dfs = (node: TreeNode | null): [number, number] => {
    if (!node) return [0, 0];
    const [leftTake, leftSkip] = dfs(node.left);
    const [rightTake, rightSkip] = dfs(node.right);
    // Taking the node forces both children to be skipped; skipping it frees them.
    return [node.val + leftSkip + rightSkip, Math.max(leftTake, leftSkip) + Math.max(rightTake, rightSkip)];
  };
  return Math.max(...dfs(root));
}
