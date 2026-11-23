class Solution {
public:
    // O(n log n) time - in sorted order the closest value to any element is one of its neighbours.
    vector<vector<int>> minimumAbsDifference(vector<int>& arr) {
        vector<int> values(arr);
        sort(values.begin(), values.end());
        // INT_MAX, not 10^6: two values at the ends of the range are 2 * 10^6 apart.
        int best = INT_MAX;
        for (size_t i = 1; i < values.size(); i++) best = min(best, values[i] - values[i - 1]);
        // Scanning left to right yields the pairs already in ascending order.
        vector<vector<int>> pairs;
        for (size_t i = 1; i < values.size(); i++) {
            if (values[i] - values[i - 1] == best) pairs.push_back({values[i - 1], values[i]});
        }
        return pairs;
    }
};
