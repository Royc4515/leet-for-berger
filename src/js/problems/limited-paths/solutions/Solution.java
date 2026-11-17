// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1600-1699/1697.Checking%20Existence%20of%20Edge%20Length%20Limited%20Paths/Solution.java
import java.util.*;

class Solution {
    private int[] p;
    private int[] size;

    // O(E log E + Q log Q) - answer the queries offline in increasing limit. The usable edge
    // set only grows with the limit, so one union-find, fed edges in increasing length, serves
    // every query.
    public boolean[] distanceLimitedPathsExist(int n, int[][] edgeList, int[][] queries) {
        p = new int[n];
        size = new int[n];
        for (int i = 0; i < n; ++i) {
            p[i] = i;
            size[i] = 1;
        }
        int[][] edges = edgeList.clone();
        Arrays.sort(edges, (a, b) -> Integer.compare(a[2], b[2]));
        int m = queries.length;
        // Sorting indexes, not the queries, keeps track of where each answer belongs.
        Integer[] qid = new Integer[m];
        for (int i = 0; i < m; ++i) {
            qid[i] = i;
        }
        Arrays.sort(qid, (i, j) -> Integer.compare(queries[i][2], queries[j][2]));
        boolean[] ans = new boolean[m];
        int j = 0;
        for (int i : qid) {
            int a = queries[i][0], b = queries[i][1], limit = queries[i][2];
            // Strictly shorter: an edge equal to the limit stays out.
            while (j < edges.length && edges[j][2] < limit) {
                int u = find(edges[j][0]), v = find(edges[j][1]);
                if (u != v) {
                    if (size[u] < size[v]) {
                        int t = u;
                        u = v;
                        v = t;
                    }
                    p[v] = u;
                    size[u] += size[v];
                }
                ++j;
            }
            ans[i] = find(a) == find(b);
        }
        return ans;
    }

    // Iterative with path halving: a recursive find can go 10^5 deep on a path graph.
    private int find(int x) {
        while (p[x] != x) {
            p[x] = p[p[x]];
            x = p[x];
        }
        return x;
    }
}
