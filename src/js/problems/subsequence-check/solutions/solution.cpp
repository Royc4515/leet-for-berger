// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0392.Is%20Subsequence/Solution.cpp
class Solution {
public:
    // O(|s| + |t|) time, O(1) space. Matching each letter of s at its earliest spot in t
    // leaves the most room for the rest, so the greedy scan never needs to backtrack.
    bool isSubsequence(string s, string t) {
        size_t i = 0;
        for (size_t j = 0; i < s.size() && j < t.size(); j++) {
            if (s[i] == t[j]) i++;
        }
        return i == s.size();
    }
};
