public class Solution {
    // O(n) time and space: a level-order walk appends values to their column in exactly the
    // required order (higher first, left before right), so nothing needs sorting.
    public IList<IList<int>> ColumnOrder(TreeNode root) {
        var output = new List<IList<int>>();
        if (root == null) return output;
        var columns = new Dictionary<int, List<int>>();
        int low = 0, high = 0;
        var queue = new Queue<(TreeNode node, int col)>();
        queue.Enqueue((root, 0));
        while (queue.Count > 0) {
            var (node, col) = queue.Dequeue();
            if (!columns.TryGetValue(col, out var list)) {
                list = new List<int>();
                columns[col] = list;
            }
            list.Add(node.val);
            low = Math.Min(low, col);
            high = Math.Max(high, col);
            if (node.left != null) queue.Enqueue((node.left, col - 1));
            if (node.right != null) queue.Enqueue((node.right, col + 1));
        }
        // Columns are met in no particular order, but they form one contiguous range.
        for (int c = low; c <= high; c++) output.Add(columns[c]);
        return output;
    }
}
