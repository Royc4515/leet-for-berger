class Solution {
    // O(n) time, O(n) space: a monotonic stack of indices whose heights strictly decrease.
    public int[] shorelineView(int[] heights) {
        int n = heights.length;
        int[] stack = new int[n];
        int top = 0;
        for (int i = 0; i < n; i++) {
            // A building at least as tall as the one on top blocks it for good (equal heights block too).
            while (top > 0 && heights[stack[top - 1]] <= heights[i]) {
                top--;
            }
            stack[top++] = i;
        }
        // What is left sees the sea, already in increasing index order.
        return java.util.Arrays.copyOf(stack, top);
    }
}
