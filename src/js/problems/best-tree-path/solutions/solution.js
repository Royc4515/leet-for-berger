// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0124.Binary%20Tree%20Maximum%20Path%20Sum/Solution.js
/**
 * O(n) time, O(h) stack. Each node returns its best downward chain; the answer also tries the
 * path that bends at the node and uses both chains.
 * @param {TreeNode} root
 * @return {number}
 */
function maxPathSum(root) {
  let best = -Infinity;
  const down = (node) => {
    if (!node) return 0;
    // A negative chain only lowers the sum, so it is dropped (counted as 0).
    const left = Math.max(0, down(node.left));
    const right = Math.max(0, down(node.right));
    best = Math.max(best, node.val + left + right);
    // The parent can extend only one side: a path cannot fork.
    return node.val + Math.max(left, right);
  };
  down(root);
  return best;
}
