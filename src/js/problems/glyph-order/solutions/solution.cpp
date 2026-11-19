// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0269.Alien%20Dictionary/Solution.cpp
class Solution {
public:
    // O(C + 26^2): neighbors give one "x before y" edge at their first difference, then Kahn's
    // algorithm always takes the smallest free letter, which yields the alphabetically first order.
    string glyphOrder(vector<string>& words) {
        bool present[26] = {};
        for (const string& w : words)
            for (char ch : w) present[ch - 'a'] = true;
        bool edge[26][26] = {};
        int indeg[26] = {};
        for (size_t i = 0; i + 1 < words.size(); ++i) {
            const string& a = words[i];
            const string& b = words[i + 1];
            size_t m = min(a.size(), b.size());
            size_t j = 0;
            while (j < m && a[j] == b[j]) ++j;
            if (j == m) {
                // A word directly above its own proper prefix fits no order at all.
                if (a.size() > b.size()) return "";
                continue;
            }
            int u = a[j] - 'a', v = b[j] - 'a';
            // Count a repeated fact once, or its indegree never drops to zero.
            if (!edge[u][v]) {
                edge[u][v] = true;
                ++indeg[v];
            }
        }
        int total = 0;
        for (bool p : present) total += p;
        bool used[26] = {};
        string out;
        while ((int)out.size() < total) {
            int pick = -1;
            for (int c = 0; c < 26 && pick == -1; ++c)
                if (present[c] && !used[c] && indeg[c] == 0) pick = c;
            // Letters remain but none is free: they lie on a cycle.
            if (pick == -1) return "";
            used[pick] = true;
            out += (char)('a' + pick);
            for (int v = 0; v < 26; ++v)
                if (edge[pick][v]) --indeg[v];
        }
        return out;
    }
};
