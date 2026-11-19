public class Solution {
    // O(C + 26^2): neighbors give one "x before y" edge at their first difference, then Kahn's
    // algorithm always takes the smallest free letter, which yields the alphabetically first order.
    public string GlyphOrder(string[] words) {
        var present = new bool[26];
        foreach (var w in words) {
            foreach (var ch in w) present[ch - 'a'] = true;
        }
        var edge = new bool[26, 26];
        var indeg = new int[26];
        for (int i = 0; i + 1 < words.Length; ++i) {
            string a = words[i], b = words[i + 1];
            int m = Math.Min(a.Length, b.Length);
            int j = 0;
            while (j < m && a[j] == b[j]) ++j;
            if (j == m) {
                // A word directly above its own proper prefix fits no order at all.
                if (a.Length > b.Length) return "";
                continue;
            }
            int u = a[j] - 'a', v = b[j] - 'a';
            // Count a repeated fact once, or its indegree never drops to zero.
            if (!edge[u, v]) {
                edge[u, v] = true;
                ++indeg[v];
            }
        }
        int total = 0;
        foreach (var p in present) if (p) ++total;
        var used = new bool[26];
        var output = new System.Text.StringBuilder();
        while (output.Length < total) {
            int pick = -1;
            for (int c = 0; c < 26 && pick == -1; ++c) {
                if (present[c] && !used[c] && indeg[c] == 0) pick = c;
            }
            // Letters remain but none is free: they lie on a cycle.
            if (pick == -1) return "";
            used[pick] = true;
            output.Append((char)('a' + pick));
            for (int v = 0; v < 26; ++v) {
                if (edge[pick, v]) --indeg[v];
            }
        }
        return output.ToString();
    }
}
