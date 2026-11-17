public class Solution {
    // O(n) time, O(h) stack. Each node returns (taken, skipped) totals for its subtree, so no
    // subtree is ever solved twice.
    public int Rob(TreeNode root) {
        var (take, skip) = Dfs(root);
        return Math.Max(take, skip);
    }

    private static (int take, int skip) Dfs(TreeNode node) {
        if (node == null) return (0, 0);
        var (leftTake, leftSkip) = Dfs(node.left);
        var (rightTake, rightSkip) = Dfs(node.right);
        // Taking the node forces both children to be skipped; skipping it frees them.
        return (node.val + leftSkip + rightSkip, Math.Max(leftTake, leftSkip) + Math.Max(rightTake, rightSkip));
    }
}
