// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0003.Longest%20Substring%20Without%20Repeating%20Characters/Solution.cs
public class Solution {
    // O(n) time - each character enters the window once and leaves it at most once.
    public int LengthOfLongestSubstring(string s) {
        // Input is ASCII, so a fixed table replaces a hash map.
        var cnt = new int[128];
        int ans = 0, n = s.Length;
        for (int l = 0, r = 0; r < n; ++r) {
            ++cnt[s[r]];
            // Shrink from the left until the new character is no longer duplicated.
            while (cnt[s[r]] > 1) {
                --cnt[s[l++]];
            }
            ans = Math.Max(ans, r - l + 1);
        }
        return ans;
    }
}
