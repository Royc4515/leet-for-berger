class Solution {
    // O(n) time, O(h) space: carry the number the path reads so far down to the leaves.
    public int digitPathTotal(TreeNode root) {
        return walk(root, 0);
    }

    private int walk(TreeNode node, int above) {
        if (node == null) {
            return 0;
        }
        // Appending a digit to a decimal number: multiply by ten, then add it.
        int here = above * 10 + node.val;
        // Only a node with no children ends a path; a missing child contributes nothing.
        if (node.left == null && node.right == null) {
            return here;
        }
        return walk(node.left, here) + walk(node.right, here);
    }
}
