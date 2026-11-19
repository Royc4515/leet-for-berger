public class Solution {
    // Values are at most 10^5, so val - (-2^30) cannot overflow and the first difference,
    // against "no previous value", is too large to ever win.
    private const int Inf = 1 << 30;
    private int ans;
    private int pre;

    // O(n) time, O(h) space: in-order visits a BST in ascending order, and in a sorted list the
    // closest pair is always two neighbors, so compare each value with the one visited before it.
    public int MinGap(TreeNode root) {
        ans = Inf;
        pre = -Inf;
        Dfs(root);
        return ans;
    }

    private void Dfs(TreeNode node) {
        if (node == null) return;
        Dfs(node.left);
        ans = Math.Min(ans, node.val - pre);
        pre = node.val;
        Dfs(node.right);
    }
}
