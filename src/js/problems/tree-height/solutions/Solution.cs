public class Solution {
    // O(n) time, O(h) stack: a tree is one node taller than its taller subtree.
    public int MaxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.Max(MaxDepth(root.left), MaxDepth(root.right));
    }
}
