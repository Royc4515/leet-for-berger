public class Solution {
    // O(n) time, O(h) space: every node must lie strictly inside the interval its ancestors allow.
    public bool IsValidBst(TreeNode root) {
        // long bounds far outside the int range play the role of "no bound", so a node that
        // is exactly int.MinValue or int.MaxValue still fits.
        return Check(root, long.MinValue, long.MaxValue);
    }

    private bool Check(TreeNode node, long low, long high) {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;
        // Going left, this value caps the interval from above; going right, from below.
        return Check(node.left, low, node.val) && Check(node.right, node.val, high);
    }
}
