class Solution {
    // O(n) time, O(h) space: every node must lie strictly inside the interval its ancestors allow.
    public boolean isValidBst(TreeNode root) {
        // long bounds far outside the int range play the role of "no bound", so a node that
        // is exactly Integer.MIN_VALUE or Integer.MAX_VALUE still fits.
        return check(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    private boolean check(TreeNode node, long low, long high) {
        if (node == null) {
            return true;
        }
        if (node.val <= low || node.val >= high) {
            return false;
        }
        // Going left, this value caps the interval from above; going right, from below.
        return check(node.left, low, node.val) && check(node.right, node.val, high);
    }
}
