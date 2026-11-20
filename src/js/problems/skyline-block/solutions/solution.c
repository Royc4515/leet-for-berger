// O(n) time: a stack of indexes with increasing heights. A bar that is not taller than the top
// pops it, and then both limits of the popped bar are known.
int largestBlock(int* heights, int heightsSize) {
    int* stack = malloc(sizeof(int) * (heightsSize + 1));
    int top = 0;
    int best = 0;
    for (int i = 0; i <= heightsSize; i++) {
        // A height-0 sentinel after the last bar pops everything still waiting.
        int h = i < heightsSize ? heights[i] : 0;
        while (top > 0 && heights[stack[top - 1]] >= h) {
            int height = heights[stack[--top]];
            // Everything between the new top (exclusive) and i (exclusive) is at least this tall.
            int left = top > 0 ? stack[top - 1] : -1;
            int area = height * (i - left - 1);
            if (area > best) best = area;
        }
        stack[top++] = i;
    }
    free(stack);
    return best;
}
