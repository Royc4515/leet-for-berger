// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0230.Kth%20Smallest%20Element%20in%20a%20BST/Solution.ts
// O(h + k) time, O(h) stack: in-order visits a BST in ascending order, so stop at the k-th node.
function kthSmallest(root: TreeNode | null, k: number): number {
  // k is shared by every call through the closure; a copy per call would never reach 0.
  const dfs = (node: TreeNode | null): number => {
    if (!node) return -1;
    const fromLeft = dfs(node.left);
    // Values are non-negative, so -1 safely means "not found in that subtree".
    if (fromLeft !== -1) return fromLeft;
    if (--k === 0) return node.val;
    return dfs(node.right);
  };
  return dfs(root);
}
