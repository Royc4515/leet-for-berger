// O(n) time: a stack of indexes with increasing heights. A bar that is not taller than the top
// pops it, and then both limits of the popped bar are known.
class Solution {
public:
    int largestBlock(vector<int>& heights) {
        int n = heights.size();
        vector<int> stack;
        int best = 0;
        for (int i = 0; i <= n; i++) {
            // A height-0 sentinel after the last bar pops everything still waiting.
            int h = i < n ? heights[i] : 0;
            while (!stack.empty() && heights[stack.back()] >= h) {
                int height = heights[stack.back()];
                stack.pop_back();
                // Everything between the new top (exclusive) and i (exclusive) is at least this tall.
                int left = stack.empty() ? -1 : stack.back();
                best = max(best, height * (i - left - 1));
            }
            stack.push_back(i);
        }
        return best;
    }
};
