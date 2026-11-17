public class Solution {
    // O(k * E) - Bellman-Ford limited to k + 1 rounds: after round j, dist holds the cheapest
    // cost using at most j flights.
    public int FindCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        // Far above any real cost (at most 99 flights of 10^4) and safe to add a price to.
        const int Inf = 0x3f3f3f3f;
        var dist = new int[n];
        var backup = new int[n];
        Array.Fill(dist, Inf);
        dist[src] = 0;
        for (int round = 0; round <= k; round++) {
            // Every flight reads the previous round's costs; relaxing in place could chain
            // several flights in one round and break the stop limit.
            Array.Copy(dist, backup, n);
            bool changed = false;
            foreach (var e in flights) {
                int f = e[0], t = e[1], p = e[2];
                if (backup[f] + p < dist[t]) {
                    dist[t] = backup[f] + p;
                    changed = true;
                }
            }
            // Nothing improved, so more rounds cannot improve anything either.
            if (!changed) {
                break;
            }
        }
        return dist[dst] == Inf ? -1 : dist[dst];
    }
}
