public class Solution {
    // O(n) - peel the tree from the outside. A closed walk over the m nodes that must be visited
    // crosses each of their m - 1 edges twice, so the answer is 2 * (m - 1).
    public int CollectCoins(int[] coins, int[][] edges) {
        int n = coins.Length;
        if (Array.IndexOf(coins, 1) < 0) return 0;
        // For each node: its degree and the xor of its neighbours' numbers. A leaf has one
        // neighbour, so its xor is that neighbour, and no adjacency lists are needed.
        var deg = new int[n];
        var xr = new int[n];
        foreach (int[] e in edges) {
            deg[e[0]]++;
            deg[e[1]]++;
            xr[e[0]] ^= e[1];
            xr[e[1]] ^= e[0];
        }
        var gone = new bool[n];
        var queue = new int[n];
        int alive = n, tail = 0;

        // Pass 1: a leaf without a coin is never worth visiting. Removing one may expose another.
        for (int v = 0; v < n; v++) {
            if (deg[v] == 1 && coins[v] == 0) {
                gone[v] = true;
                queue[tail++] = v;
            }
        }
        for (int head = 0; head < tail; head++) {
            int v = queue[head];
            alive--;
            int p = xr[v];
            xr[p] ^= v;
            deg[p]--;
            if (deg[p] == 1 && coins[p] == 0 && !gone[p]) {
                gone[p] = true;
                queue[tail++] = p;
            }
        }

        // Pass 2, twice: a coin within distance 2 of the walk is collected from there, so the two
        // outermost layers of nodes need not be visited, whatever they hold.
        for (int round = 0; round < 2; round++) {
            int count = 0;
            for (int v = 0; v < n; v++) {
                if (!gone[v] && deg[v] == 1) queue[count++] = v;
            }
            for (int i = 0; i < count; i++) {
                int v = queue[i];
                gone[v] = true;
                alive--;
                // If the only neighbour was a leaf too (two nodes left), it is already gone.
                if (deg[v] == 1) {
                    int p = xr[v];
                    xr[p] ^= v;
                    deg[p]--;
                }
            }
        }
        return Math.Max(0, 2 * (alive - 1));
    }
}
