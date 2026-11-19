// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0269.Alien%20Dictionary/Solution.java
class Solution {
    // O(C + 26^2): neighbors give one "x before y" edge at their first difference, then Kahn's
    // algorithm always takes the smallest free letter, which yields the alphabetically first order.
    public String glyphOrder(String[] words) {
        boolean[] present = new boolean[26];
        for (String w : words) {
            for (int i = 0; i < w.length(); ++i) present[w.charAt(i) - 'a'] = true;
        }
        boolean[][] edge = new boolean[26][26];
        int[] indeg = new int[26];
        for (int i = 0; i + 1 < words.length; ++i) {
            String a = words[i], b = words[i + 1];
            int m = Math.min(a.length(), b.length());
            int j = 0;
            while (j < m && a.charAt(j) == b.charAt(j)) ++j;
            if (j == m) {
                // A word directly above its own proper prefix fits no order at all.
                if (a.length() > b.length()) return "";
                continue;
            }
            int u = a.charAt(j) - 'a', v = b.charAt(j) - 'a';
            // Count a repeated fact once, or its indegree never drops to zero.
            if (!edge[u][v]) {
                edge[u][v] = true;
                ++indeg[v];
            }
        }
        int total = 0;
        for (boolean p : present) if (p) ++total;
        boolean[] used = new boolean[26];
        StringBuilder out = new StringBuilder();
        while (out.length() < total) {
            int pick = -1;
            for (int c = 0; c < 26 && pick == -1; ++c) {
                if (present[c] && !used[c] && indeg[c] == 0) pick = c;
            }
            // Letters remain but none is free: they lie on a cycle.
            if (pick == -1) return "";
            used[pick] = true;
            out.append((char) ('a' + pick));
            for (int v = 0; v < 26; ++v) {
                if (edge[pick][v]) --indeg[v];
            }
        }
        return out.toString();
    }
}
