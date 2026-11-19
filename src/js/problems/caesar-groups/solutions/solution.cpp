// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0249.Group%20Shifted%20Strings/Solution.cpp
class Solution {
public:
    // O(n * k) time: every word is normalized once, then grouped by that key.
    vector<vector<string>> groupByShift(vector<string>& words) {
        // unordered_map has no order, so it maps key -> group index; the vector keeps order.
        unordered_map<string, int> index;
        vector<vector<string>> groups;
        for (const string& w : words) {
            string key;
            int diff = w[0] - 'a';
            for (char ch : w) {
                // Shift back so the word starts with 'a'; a letter that falls below 'a' wraps.
                char c = ch - diff;
                if (c < 'a') c += 26;
                key.push_back(c);
            }
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
