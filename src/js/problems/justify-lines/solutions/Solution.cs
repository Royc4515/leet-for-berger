// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0068.Text%20Justification/Solution.cs
public class Solution {
    // O(total output) - greedy packing, then spacing rules per line.
    public IList<string> JustifyText(string[] words, int maxWidth) {
        var ans = new List<string>();
        for (int i = 0, n = words.Length; i < n;) {
            // cnt is the line's width with single gaps; take words while that still fits.
            var t = new List<string> { words[i] };
            int cnt = words[i++].Length;
            while (i < n && cnt + 1 + words[i].Length <= maxWidth) {
                cnt += 1 + words[i].Length;
                t.Add(words[i++]);
            }
            // The last line and one-word lines are left-aligned (a one-word line has no gap to widen).
            if (i == n || t.Count == 1) {
                var left = string.Join(" ", t);
                ans.Add(left.PadRight(maxWidth));
                continue;
            }
            int gaps = t.Count - 1;
            int spaceWidth = maxWidth - (cnt - gaps);
            // Leftmost gaps take the remainder, one extra space each.
            int w = spaceWidth / gaps, m = spaceWidth % gaps;
            var row = new System.Text.StringBuilder();
            for (int j = 0; j < gaps; j++) {
                row.Append(t[j]);
                row.Append(' ', w + (j < m ? 1 : 0));
            }
            row.Append(t[gaps]);
            ans.Add(row.ToString());
        }
        return ans;
    }
}
