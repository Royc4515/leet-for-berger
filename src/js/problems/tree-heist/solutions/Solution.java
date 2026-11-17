// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0337.House%20Robber%20III/Solution.java
class Solution {
    // O(n) time, O(h) stack. Each node returns {taken, skipped} totals for its subtree, so no
    // subtree is ever solved twice.
    public int rob(TreeNode root) {
        int[] best = dfs(root);
        return Math.max(best[0], best[1]);
    }

    private int[] dfs(TreeNode node) {
        if (node == null) return new int[2];
        int[] l = dfs(node.left);
        int[] r = dfs(node.right);
        // Taking the node forces both children to be skipped; skipping it frees them.
        return new int[] {node.val + l[1] + r[1], Math.max(l[0], l[1]) + Math.max(r[0], r[1])};
    }
}
