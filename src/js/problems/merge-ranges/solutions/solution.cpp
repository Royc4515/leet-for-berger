class Solution {
public:
    // O(n log n) time - after sorting by start, a range can only overlap the one being built.
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });
        vector<vector<int>> merged;
        for (const auto& r : intervals) {
            // `<=` because ranges are closed: [1, 4] and [4, 5] share the point 4.
            if (!merged.empty() && r[0] <= merged.back()[1]) {
                // max, not r[1]: the current range may already reach past this one.
                merged.back()[1] = max(merged.back()[1], r[1]);
            } else {
                merged.push_back({r[0], r[1]});
            }
        }
        return merged;
    }
};
