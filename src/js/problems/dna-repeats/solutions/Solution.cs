// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0187.Repeated%20DNA%20Sequences/Solution.cs
public class Solution {
    // O(n) windows (each substring is 10 characters), then a sort of the repeated ones.
    public IList<string> RepeatedWindows(string s) {
        var cnt = new Dictionary<string, int>();
        var ans = new List<string>();
        for (int i = 0; i + 10 <= s.Length; ++i) {
            var t = s.Substring(i, 10);
            cnt.TryGetValue(t, out int c);
            cnt[t] = c + 1;
            // Report on the second sighting only, so a window seen three times is listed once.
            if (c + 1 == 2) {
                ans.Add(t);
            }
        }
        // Ordinal, not the default culture-aware comparison, which may not be byte order.
        ans.Sort(StringComparer.Ordinal);
        return ans;
    }
}
