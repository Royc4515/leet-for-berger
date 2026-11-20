// O(n) time: a stack of indexes with increasing heights. A bar that is not taller than the top
// pops it, and then both limits of the popped bar are known.
class Solution {
    public int largestBlock(int[] heights) {
        int n = heights.length;
        int[] stack = new int[n + 1];
        int top = 0;
        int best = 0;
        for (int i = 0; i <= n; i++) {
            // A height-0 sentinel after the last bar pops everything still waiting.
            int h = i < n ? heights[i] : 0;
            while (top > 0 && heights[stack[top - 1]] >= h) {
                int height = heights[stack[--top]];
                // Everything between the new top (exclusive) and i (exclusive) is at least this tall.
                int left = top > 0 ? stack[top - 1] : -1;
                best = Math.max(best, height * (i - left - 1));
            }
            stack[top++] = i;
        }
        return best;
    }
}
