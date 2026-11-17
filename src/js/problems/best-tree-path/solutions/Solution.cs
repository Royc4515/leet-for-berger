// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0124.Binary%20Tree%20Maximum%20Path%20Sum/Solution.cs
public class Solution {
    // O(n) time, O(h) stack. The best total is a local passed by reference, not a field, so an
    // instance reused across calls starts clean.
    public int MaxPathSum(TreeNode root) {
        int best = int.MinValue;
        Down(root, ref best);
        return best;
    }

    // Returns the best downward chain from node; records the path bending at node in best.
    private static int Down(TreeNode node, ref int best) {
        if (node == null) return 0;
        // A negative chain only lowers the sum, so it is dropped (counted as 0).
        int left = Math.Max(0, Down(node.left, ref best));
        int right = Math.Max(0, Down(node.right, ref best));
        best = Math.Max(best, node.val + left + right);
        // The parent can extend only one side: a path cannot fork.
        return node.val + Math.Max(left, right);
    }
}
