// O(n) time, O(h) space: carry the number the path reads so far down to the leaves.
function digitPathTotal(root: TreeNode | null): number {
  const walk = (node: TreeNode | null, above: number): number => {
    if (!node) return 0;
    // Appending a digit to a decimal number: multiply by ten, then add it.
    const here = above * 10 + node.val;
    // Only a node with no children ends a path; a missing child contributes nothing.
    if (!node.left && !node.right) return here;
    return walk(node.left, here) + walk(node.right, here);
  };
  return walk(root, 0);
}
