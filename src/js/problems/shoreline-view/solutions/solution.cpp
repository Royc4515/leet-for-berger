class Solution {
public:
    // O(n) time, O(n) space: a monotonic stack of indices whose heights strictly decrease.
    vector<int> shorelineView(vector<int>& heights) {
        vector<int> stack;
        for (int i = 0; i < (int)heights.size(); i++) {
            // A building at least as tall as the one on top blocks it for good (equal heights block too).
            while (!stack.empty() && heights[stack.back()] <= heights[i]) {
                stack.pop_back();
            }
            stack.push_back(i);
        }
        // What is left sees the sea, already in increasing index order.
        return stack;
    }
};
