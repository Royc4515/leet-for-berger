class Solution {
public:
    // O(n log n + L log n): sort once, then for each typed prefix the matching names form one
    // block that starts at the first name that is not smaller than the prefix.
    vector<vector<string>> suggestNames(vector<string>& products, string& searchWord) {
        vector<string> sorted = products;
        sort(sorted.begin(), sorted.end());
        vector<vector<string>> out;
        auto start = sorted.begin();
        for (size_t i = 1; i <= searchWord.size(); i++) {
            string prefix = searchWord.substr(0, i);
            // A longer prefix keeps only a subset of the shorter one's matches, so the search can
            // begin where the previous one ended.
            start = lower_bound(start, sorted.end(), prefix);
            vector<string> row;
            for (auto it = start; it != sorted.end() && row.size() < 3 && it->compare(0, prefix.size(), prefix) == 0; ++it) {
                row.push_back(*it);
            }
            out.push_back(row);
        }
        return out;
    }
};
