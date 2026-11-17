// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0014.Longest%20Common%20Prefix/Solution.cpp
class Solution {
public:
    // O(total length) - vertical scan: column i of every word, stopping at the first mismatch.
    string longestCommonPrefix(vector<string>& strs) {
        int n = strs.size();
        for (size_t i = 0; i < strs[0].size(); ++i) {
            for (int j = 1; j < n; ++j) {
                // Check the length first: a shorter word has run out, so the prefix ends here.
                if (strs[j].size() <= i || strs[j][i] != strs[0][i]) {
                    return strs[0].substr(0, i);
                }
            }
        }
        return strs[0];
    }
};
