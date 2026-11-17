// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0072.Edit%20Distance/Solution.cpp
class Solution {
public:
    // O(m * n) time, O(n) space: one DP row over prefixes of word2 per letter of word1.
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<int> prev(n + 1), cur(n + 1);
        for (int j = 0; j <= n; ++j) prev[j] = j;
        for (int i = 1; i <= m; ++i) {
            cur[0] = i;
            for (int j = 1; j <= n; ++j) {
                if (word1[i - 1] == word2[j - 1]) {
                    cur[j] = prev[j - 1];
                } else {
                    // Replace, delete from word1, insert into word1.
                    cur[j] = min({prev[j - 1], prev[j], cur[j - 1]}) + 1;
                }
            }
            swap(prev, cur);
        }
        return prev[n];
    }
};
