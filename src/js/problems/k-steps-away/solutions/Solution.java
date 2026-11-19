// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0863.All%20Nodes%20Distance%20K%20in%20Binary%20Tree/Solution.java
import java.util.*;

class Solution {
    // O(n + m log m): nodes only point down, so record every parent first; then the tree is an
    // undirected graph and k rounds of breadth-first search from the target reach exactly distance k.
    public int[] kStepsAway(TreeNode root, int target, int k) {
        // TreeNode keeps identity equality, so the maps are keyed by node, not by value.
        Map<TreeNode, TreeNode> parent = new HashMap<>();
        parent.put(root, null);
        TreeNode start = root;
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            if (node.val == target) start = node;
            for (TreeNode child : new TreeNode[] {node.left, node.right}) {
                if (child != null) {
                    parent.put(child, node);
                    queue.offer(child);
                }
            }
        }
        // The seen set stops the search from stepping back to where it came from.
        Set<TreeNode> seen = new HashSet<>();
        seen.add(start);
        List<TreeNode> frontier = new ArrayList<>();
        frontier.add(start);
        for (int step = 0; step < k && !frontier.isEmpty(); ++step) {
            List<TreeNode> next = new ArrayList<>();
            for (TreeNode node : frontier) {
                for (TreeNode nb : new TreeNode[] {node.left, node.right, parent.get(node)}) {
                    if (nb != null && seen.add(nb)) next.add(nb);
                }
            }
            frontier = next;
        }
        int[] out = new int[frontier.size()];
        for (int i = 0; i < out.length; ++i) out[i] = frontier.get(i).val;
        Arrays.sort(out);
        return out;
    }
}
