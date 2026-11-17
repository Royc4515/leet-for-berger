public class Solution {
    // O((V + E) log V) - Dijkstra with a binary heap. Delays are never negative, so the node
    // with the smallest tentative time can no longer improve once it is popped.
    public int NetworkDelayTime(int[][] times, int n, int k) {
        var adj = new List<(int To, int W)>[n + 1];
        for (int i = 0; i <= n; ++i) {
            adj[i] = new List<(int, int)>();
        }
        foreach (var t in times) {
            adj[t[0]].Add((t[1], t[2]));
        }
        const int Inf = int.MaxValue;
        var dist = new int[n + 1];
        Array.Fill(dist, Inf);
        dist[k] = 0;
        var pq = new PriorityQueue<int, int>();
        pq.Enqueue(k, 0);
        while (pq.TryDequeue(out int u, out int d)) {
            // A stale entry: u was already settled with a smaller time.
            if (d > dist[u]) {
                continue;
            }
            foreach (var (v, w) in adj[u]) {
                if (d + w < dist[v]) {
                    dist[v] = d + w;
                    pq.Enqueue(v, dist[v]);
                }
            }
        }
        // The last node to hear the signal decides; one that never hears it makes it -1.
        int ans = 0;
        for (int v = 1; v <= n; ++v) {
            ans = Math.Max(ans, dist[v]);
        }
        return ans == Inf ? -1 : ans;
    }
}
