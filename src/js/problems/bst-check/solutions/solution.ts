// O(n) time, O(h) space: every node must lie strictly inside the interval its ancestors allow.
function isValidBst(root: TreeNode | null): boolean {
  // Infinity means "no bound", so values at the ends of the 32-bit range are never special.
  const check = (node: TreeNode | null, low: number, high: number): boolean => {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    // Going left, this value caps the interval from above; going right, from below.
    return check(node.left, low, node.val) && check(node.right, node.val, high);
  };
  return check(root, -Infinity, Infinity);
}
