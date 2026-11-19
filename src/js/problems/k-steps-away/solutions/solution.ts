// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0863.All%20Nodes%20Distance%20K%20in%20Binary%20Tree/Solution.ts
// O(n + m log m): nodes only point down, so record every parent first; then the tree is an
// undirected graph and k rounds of breadth-first search from the target reach exactly distance k.
function kStepsAway(root: TreeNode | null, target: number, k: number): number[] {
  if (!root) return [];
  const parent = new Map<TreeNode, TreeNode | null>([[root, null]]);
  let start: TreeNode = root;
  const queue: TreeNode[] = [root];
  for (let h = 0; h < queue.length; h++) {
    const node = queue[h];
    if (node.val === target) start = node;
    for (const child of [node.left, node.right]) {
      if (child) {
        parent.set(child, node);
        queue.push(child);
      }
    }
  }
  // The seen set stops the search from stepping back to where it came from.
  const seen = new Set<TreeNode>([start]);
  let frontier: TreeNode[] = [start];
  for (let step = 0; step < k && frontier.length; step++) {
    const next: TreeNode[] = [];
    for (const node of frontier) {
      for (const nb of [node.left, node.right, parent.get(node) ?? null]) {
        if (nb && !seen.has(nb)) {
          seen.add(nb);
          next.push(nb);
        }
      }
    }
    frontier = next;
  }
  return frontier.map((n) => n.val).sort((a, b) => a - b);
}
