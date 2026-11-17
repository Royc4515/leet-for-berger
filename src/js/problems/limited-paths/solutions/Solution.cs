public class Solution {
    private int[] p;
    private int[] size;

    // O(E log E + Q log Q) - answer the queries offline in increasing limit. The usable edge
    // set only grows with the limit, so one union-find, fed edges in increasing length, serves
    // every query.
    public bool[] DistanceLimitedPathsExist(int n, int[][] edgeList, int[][] queries) {
        p = new int[n];
        size = new int[n];
        for (int i = 0; i < n; ++i) {
            p[i] = i;
            size[i] = 1;
        }
        var edges = (int[][])edgeList.Clone();
        Array.Sort(edges, (a, b) => a[2].CompareTo(b[2]));
        int m = queries.Length;
        // Sorting indexes, not the queries, keeps track of where each answer belongs.
        var qid = new int[m];
        for (int i = 0; i < m; ++i) {
            qid[i] = i;
        }
        Array.Sort(qid, (x, y) => queries[x][2].CompareTo(queries[y][2]));
        var ans = new bool[m];
        int j = 0;
        foreach (int i in qid) {
            int a = queries[i][0], b = queries[i][1], limit = queries[i][2];
            // Strictly shorter: an edge equal to the limit stays out.
            while (j < edges.Length && edges[j][2] < limit) {
                int u = Find(edges[j][0]), v = Find(edges[j][1]);
                if (u != v) {
                    if (size[u] < size[v]) {
                        (u, v) = (v, u);
                    }
                    p[v] = u;
                    size[u] += size[v];
                }
                ++j;
            }
            ans[i] = Find(a) == Find(b);
        }
        return ans;
    }

    // Iterative with path halving: a recursive find can go 10^5 deep on a path graph.
    private int Find(int x) {
        while (p[x] != x) {
            p[x] = p[p[x]];
            x = p[x];
        }
        return x;
    }
}
