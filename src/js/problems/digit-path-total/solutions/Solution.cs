public class Solution {
    // O(n) time, O(h) space: carry the number the path reads so far down to the leaves.
    public int DigitPathTotal(TreeNode root) {
        return Walk(root, 0);
    }

    private int Walk(TreeNode node, int above) {
        if (node == null) {
            return 0;
        }
        // Appending a digit to a decimal number: multiply by ten, then add it.
        int here = above * 10 + node.val;
        // Only a node with no children ends a path; a missing child contributes nothing.
        if (node.left == null && node.right == null) {
            return here;
        }
        return Walk(node.left, here) + Walk(node.right, here);
    }
}
