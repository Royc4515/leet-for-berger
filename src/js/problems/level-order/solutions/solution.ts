// O(n) time, O(w) space - BFS, one level per outer iteration.
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const out: number[][] = [];
  let level: TreeNode[] = [root];
  while (level.length) {
    out.push(level.map((n) => n.val));
    // Building the next level as its own array marks the boundary without counting.
    const next: TreeNode[] = [];
    for (const n of level) {
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    level = next;
  }
  return out;
}
