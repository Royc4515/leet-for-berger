// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0104.Maximum%20Depth%20of%20Binary%20Tree/Solution.js
/**
 * O(n) time, O(h) stack: a tree is one node taller than its taller subtree.
 * @param {TreeNode} root
 * @return {number}
 */
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
