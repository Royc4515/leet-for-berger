class Solution {
public:
    // O(n + q log n) time: prefix sums once, then one binary search per draw.
    vector<int> weightedDrawLookup(vector<int>& weights, vector<int>& draws) {
        vector<int> prefix(weights.size());
        int total = 0; // at most 10^9, so an int does not overflow
        for (size_t i = 0; i < weights.size(); i++) {
            total += weights[i];
            prefix[i] = total;
        }
        vector<int> result;
        result.reserve(draws.size());
        for (int d : draws) {
            // Index i owns [prefix[i - 1], prefix[i]): the first prefix strictly above d.
            result.push_back((int)(upper_bound(prefix.begin(), prefix.end(), d) - prefix.begin()));
        }
        return result;
    }
};
