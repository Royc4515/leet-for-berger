public class Solution {
    // O(n) time, O(w) space - BFS, one level per outer iteration.
    public IList<IList<int>> LevelOrder(TreeNode root) {
        var output = new List<IList<int>>();
        if (root == null) return output;
        var queue = new Queue<TreeNode>();
        queue.Enqueue(root);
        while (queue.Count > 0) {
            // The queue holds exactly one level right now; its count is that level's size.
            int size = queue.Count;
            var level = new List<int>(size);
            for (int i = 0; i < size; i++) {
                var node = queue.Dequeue();
                level.Add(node.val);
                if (node.left != null) queue.Enqueue(node.left);
                if (node.right != null) queue.Enqueue(node.right);
            }
            output.Add(level);
        }
        return output;
    }
}
