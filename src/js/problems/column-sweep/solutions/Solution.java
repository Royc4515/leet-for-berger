import java.util.*;

class Solution {
    // O(n) time and space: a level-order walk appends values to their column in exactly the
    // required order (higher first, left before right), so nothing needs sorting.
    public List<List<Integer>> columnOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        if (root == null) {
            return out;
        }
        Map<Integer, List<Integer>> columns = new HashMap<>();
        int low = 0;
        int high = 0;
        Deque<TreeNode> nodes = new ArrayDeque<>();
        Deque<Integer> cols = new ArrayDeque<>();
        nodes.add(root);
        cols.add(0);
        while (!nodes.isEmpty()) {
            TreeNode node = nodes.poll();
            int col = cols.poll();
            columns.computeIfAbsent(col, c -> new ArrayList<>()).add(node.val);
            low = Math.min(low, col);
            high = Math.max(high, col);
            if (node.left != null) {
                nodes.add(node.left);
                cols.add(col - 1);
            }
            if (node.right != null) {
                nodes.add(node.right);
                cols.add(col + 1);
            }
        }
        // Columns are met in no particular order, but they form one contiguous range.
        for (int c = low; c <= high; c++) {
            out.add(columns.get(c));
        }
        return out;
    }
}
