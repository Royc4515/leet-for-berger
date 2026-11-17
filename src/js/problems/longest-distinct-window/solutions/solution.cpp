// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0003.Longest%20Substring%20Without%20Repeating%20Characters/Solution.cpp
class Solution {
public:
    // O(n) time - each character enters the window once and leaves it at most once.
    int lengthOfLongestSubstring(string s) {
        // Input is ASCII, so a fixed table replaces a hash map.
        int cnt[128]{};
        int ans = 0, n = s.size();
        for (int l = 0, r = 0; r < n; ++r) {
            ++cnt[(unsigned char)s[r]];
            // Shrink from the left until the new character is no longer duplicated.
            while (cnt[(unsigned char)s[r]] > 1) {
                --cnt[(unsigned char)s[l++]];
            }
            ans = max(ans, r - l + 1);
        }
        return ans;
    }
};
