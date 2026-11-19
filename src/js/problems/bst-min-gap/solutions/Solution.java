// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0783.Minimum%20Distance%20Between%20BST%20Nodes/Solution.java
class Solution {
    // Values are at most 10^5, so val - (-2^30) stays far below Integer.MAX_VALUE and the first
    // difference, against "no previous value", is too large to ever win.
    private static final int INF = 1 << 30;
    private int ans;
    private int pre;

    // O(n) time, O(h) space: in-order visits a BST in ascending order, and in a sorted list the
    // closest pair is always two neighbors, so compare each value with the one visited before it.
    public int minGap(TreeNode root) {
        ans = INF;
        pre = -INF;
        dfs(root);
        return ans;
    }

    private void dfs(TreeNode node) {
        if (node == null) {
            return;
        }
        dfs(node.left);
        ans = Math.min(ans, node.val - pre);
        pre = node.val;
        dfs(node.right);
    }
}
