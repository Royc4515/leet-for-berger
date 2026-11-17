// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0684.Redundant%20Connection/Solution.cpp
class Solution {
public:
    // O(n alpha(n)) time - union-find in input order; the first link whose ends are already
    // connected closes the cycle, and every other cycle link came before it.
    vector<int> findRedundantConnection(vector<vector<int>>& edges) {
        int n = edges.size();
        vector<int> p(n + 1), size(n + 1, 1);
        iota(p.begin(), p.end(), 0);
        // Iterative with path halving: a recursive find can go 10^5 deep before compressing.
        auto find = [&](int x) {
            while (p[x] != x) {
                p[x] = p[p[x]];
                x = p[x];
            }
            return x;
        };
        for (auto& e : edges) {
            int pa = find(e[0]), pb = find(e[1]);
            if (pa == pb) return e;
            // Union by size keeps every tree shallow.
            if (size[pa] < size[pb]) swap(pa, pb);
            p[pb] = pa;
            size[pa] += size[pb];
        }
        return {};
    }
};
