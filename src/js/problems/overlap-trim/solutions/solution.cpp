// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0435.Non-overlapping%20Intervals/Solution.cpp
class Solution {
public:
    // O(n log n) time - keeping the interval that ends first leaves the most room for the rest.
    int eraseOverlapIntervals(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[1] < b[1];
        });
        int ans = intervals.size();
        // Below every allowed start, so the first interval is always kept.
        int lastEnd = INT_MIN;
        for (const auto& e : intervals) {
            // '>=' because touching at an endpoint is not an overlap.
            if (e[0] >= lastEnd) {
                --ans;
                lastEnd = e[1];
            }
        }
        return ans;
    }
};
