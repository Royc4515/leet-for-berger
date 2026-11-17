// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1600-1699/1697.Checking%20Existence%20of%20Edge%20Length%20Limited%20Paths/Solution.cpp
class Solution {
public:
    // O(E log E + Q log Q) - answer the queries offline in increasing limit. The usable edge
    // set only grows with the limit, so one union-find, fed edges in increasing length, serves
    // every query.
    vector<bool> distanceLimitedPathsExist(int n, vector<vector<int>>& edgeList, vector<vector<int>>& queries) {
        vector<int> p(n), size(n, 1);
        iota(p.begin(), p.end(), 0);
        // Iterative with path halving: no recursion depth to worry about on a path graph.
        auto find = [&](int x) {
            while (p[x] != x) {
                p[x] = p[p[x]];
                x = p[x];
            }
            return x;
        };
        vector<vector<int>> edges = edgeList;
        sort(edges.begin(), edges.end(), [](auto& a, auto& b) { return a[2] < b[2]; });
        int m = queries.size();
        // Sorting indexes, not the queries, keeps track of where each answer belongs.
        vector<int> qid(m);
        iota(qid.begin(), qid.end(), 0);
        sort(qid.begin(), qid.end(), [&](int i, int j) { return queries[i][2] < queries[j][2]; });
        vector<bool> ans(m);
        size_t j = 0;
        for (int i : qid) {
            int a = queries[i][0], b = queries[i][1], limit = queries[i][2];
            // Strictly shorter: an edge equal to the limit stays out.
            while (j < edges.size() && edges[j][2] < limit) {
                int u = find(edges[j][0]), v = find(edges[j][1]);
                if (u != v) {
                    if (size[u] < size[v]) swap(u, v);
                    p[v] = u;
                    size[u] += size[v];
                }
                ++j;
            }
            ans[i] = find(a) == find(b);
        }
        return ans;
    }
};
