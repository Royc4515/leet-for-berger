// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0124.Binary%20Tree%20Maximum%20Path%20Sum/Solution.java
class Solution {
    // O(n) time, O(h) stack. The best total lives in a local holder, not a field, so an
    // instance reused across calls starts clean.
    public int maxPathSum(TreeNode root) {
        int[] best = {Integer.MIN_VALUE};
        down(root, best);
        return best[0];
    }

    // Returns the best downward chain from node; records the path bending at node in best.
    private int down(TreeNode node, int[] best) {
        if (node == null) return 0;
        // A negative chain only lowers the sum, so it is dropped (counted as 0).
        int left = Math.max(0, down(node.left, best));
        int right = Math.max(0, down(node.right, best));
        best[0] = Math.max(best[0], node.val + left + right);
        // The parent can extend only one side: a path cannot fork.
        return node.val + Math.max(left, right);
    }
}
