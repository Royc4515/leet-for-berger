public class Solution {
    // O(h + k) time, O(h) space: an in-order walk of a BST yields values in ascending order,
    // so the k-th node popped is the answer and the rest of the tree is never visited.
    public int KthSmallest(TreeNode root, int k) {
        var stack = new Stack<TreeNode>();
        var node = root;
        while (node != null || stack.Count > 0) {
            if (node != null) {
                stack.Push(node);
                node = node.left;
            } else {
                node = stack.Pop();
                if (--k == 0) return node.val;
                node = node.right;
            }
        }
        return -1;
    }
}
