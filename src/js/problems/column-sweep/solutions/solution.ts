// O(n) time and space: a level-order walk appends values to their column in exactly the required
// order (higher first, left before right), so nothing needs sorting.
function columnOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const columns = new Map<number, number[]>();
  let low = 0;
  let high = 0;
  const queue: [TreeNode, number][] = [[root, 0]];
  // An index instead of shift() keeps the queue O(1) per step.
  for (let head = 0; head < queue.length; head++) {
    const [node, col] = queue[head];
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(node.val);
    low = Math.min(low, col);
    high = Math.max(high, col);
    if (node.left) queue.push([node.left, col - 1]);
    if (node.right) queue.push([node.right, col + 1]);
  }
  // Columns are met in no particular order, but they form one contiguous range.
  const out: number[][] = [];
  for (let c = low; c <= high; c++) out.push(columns.get(c)!);
  return out;
}
