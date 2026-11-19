public class Solution {
    // O(n + m log m): nodes only point down, so record every parent first; then the tree is an
    // undirected graph and k rounds of breadth-first search from the target reach exactly distance k.
    public int[] KStepsAway(TreeNode root, int target, int k) {
        // TreeNode keeps reference equality, so the maps are keyed by node, not by value.
        var parent = new Dictionary<TreeNode, TreeNode> { [root] = null };
        var start = root;
        var queue = new Queue<TreeNode>();
        queue.Enqueue(root);
        while (queue.Count > 0) {
            var node = queue.Dequeue();
            if (node.val == target) start = node;
            foreach (var child in new[] { node.left, node.right }) {
                if (child != null) {
                    parent[child] = node;
                    queue.Enqueue(child);
                }
            }
        }
        // The seen set stops the search from stepping back to where it came from.
        var seen = new HashSet<TreeNode> { start };
        var frontier = new List<TreeNode> { start };
        for (int step = 0; step < k && frontier.Count > 0; ++step) {
            var next = new List<TreeNode>();
            foreach (var node in frontier) {
                foreach (var nb in new[] { node.left, node.right, parent[node] }) {
                    if (nb != null && seen.Add(nb)) next.Add(nb);
                }
            }
            frontier = next;
        }
        var output = frontier.Select(n => n.val).ToArray();
        Array.Sort(output);
        return output;
    }
}
