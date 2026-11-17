public class Solution {
    private int[] p;
    private int[] size;

    // O(n alpha(n)) time - union-find in input order; the first link whose ends are already
    // connected closes the cycle, and every other cycle link came before it.
    public int[] FindRedundantConnection(int[][] edges) {
        int n = edges.Length;
        p = new int[n + 1];
        size = new int[n + 1];
        for (int i = 0; i <= n; ++i) {
            p[i] = i;
            size[i] = 1;
        }
        foreach (var e in edges) {
            int pa = Find(e[0]), pb = Find(e[1]);
            if (pa == pb) {
                return e;
            }
            // Union by size keeps every tree shallow.
            if (size[pa] < size[pb]) {
                (pa, pb) = (pb, pa);
            }
            p[pb] = pa;
            size[pa] += size[pb];
        }
        return new int[0];
    }

    // Iterative with path halving: a recursive find can go 10^5 deep before compressing.
    private int Find(int x) {
        while (p[x] != x) {
            p[x] = p[p[x]];
            x = p[x];
        }
        return x;
    }
}
