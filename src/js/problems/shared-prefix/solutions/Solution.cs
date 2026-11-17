// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0014.Longest%20Common%20Prefix/Solution.cs
public class Solution {
    // O(total length) - vertical scan: column i of every word, stopping at the first mismatch.
    public string LongestCommonPrefix(string[] strs) {
        int n = strs.Length;
        for (int i = 0; i < strs[0].Length; ++i) {
            for (int j = 1; j < n; ++j) {
                // Check the length first: a shorter word has run out, so the prefix ends here.
                if (i >= strs[j].Length || strs[j][i] != strs[0][i]) {
                    return strs[0].Substring(0, i);
                }
            }
        }
        return strs[0];
    }
}
