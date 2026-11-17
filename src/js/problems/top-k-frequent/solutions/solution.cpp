class Solution {
public:
    // O(n + d log d) time - count once, then order the d distinct values by the rule.
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int, int> count;
        for (int x : nums) count[x]++;
        vector<int> values;
        values.reserve(count.size());
        for (auto& [v, c] : count) values.push_back(v);
        sort(values.begin(), values.end(), [&](int a, int b) {
            return count[a] != count[b] ? count[a] > count[b] : a < b;
        });
        values.resize(k);
        return values;
    }
};
