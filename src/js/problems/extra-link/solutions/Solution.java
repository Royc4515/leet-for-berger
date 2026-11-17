// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0684.Redundant%20Connection/Solution.java
class Solution {
    private int[] p;
    private int[] size;

    // O(n alpha(n)) time - union-find in input order; the first link whose ends are already
    // connected closes the cycle, and every other cycle link came before it.
    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        p = new int[n + 1];
        size = new int[n + 1];
        for (int i = 0; i <= n; ++i) {
            p[i] = i;
            size[i] = 1;
        }
        for (int[] e : edges) {
            int pa = find(e[0]), pb = find(e[1]);
            if (pa == pb) {
                return e;
            }
            // Union by size keeps every tree shallow.
            if (size[pa] < size[pb]) {
                int t = pa;
                pa = pb;
                pb = t;
            }
            p[pb] = pa;
            size[pa] += size[pb];
        }
        return new int[0];
    }

    // Iterative with path halving: a recursive find can go 10^5 deep before compressing.
    private int find(int x) {
        while (p[x] != x) {
            p[x] = p[p[x]];
            x = p[x];
        }
        return x;
    }
}
