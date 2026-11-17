// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0230.Kth%20Smallest%20Element%20in%20a%20BST/Solution.java
import java.util.*;

class Solution {
    // O(h + k) time, O(h) space: an in-order walk of a BST yields values in ascending order,
    // so the k-th node popped is the answer and the rest of the tree is never visited.
    public int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (node != null || !stack.isEmpty()) {
            if (node != null) {
                stack.push(node);
                node = node.left;
            } else {
                node = stack.pop();
                if (--k == 0) return node.val;
                node = node.right;
            }
        }
        return -1;
    }
}
