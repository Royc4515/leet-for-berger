class Solution {
public:
    // O(n * k log k) time - the sorted letters are the same key for every anagram.
    vector<vector<string>> groupAnagrams(vector<string>& words) {
        // unordered_map has no order, so it maps key -> group index; the vector keeps order.
        unordered_map<string, int> index;
        vector<vector<string>> groups;
        for (const string& w : words) {
            string key = w;
            sort(key.begin(), key.end());
            auto it = index.find(key);
            if (it == index.end()) {
                index.emplace(key, groups.size());
                groups.push_back({w});
            } else {
                groups[it->second].push_back(w);
            }
        }
        return groups;
    }
};
