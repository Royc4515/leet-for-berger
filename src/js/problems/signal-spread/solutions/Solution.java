import java.util.*;

class Solution {
    // O((V + E) log V) - Dijkstra with a binary heap. Delays are never negative, so the node
    // with the smallest tentative time can no longer improve once it is popped.
    public int networkDelayTime(int[][] times, int n, int k) {
        // Adjacency in compressed form (offsets into flat arrays): no list object per node.
        int[] start = new int[n + 2];
        for (int[] t : times) {
            start[t[0] + 1]++;
        }
        for (int i = 1; i <= n + 1; ++i) {
            start[i] += start[i - 1];
        }
        int[] to = new int[times.length];
        int[] weight = new int[times.length];
        int[] fill = start.clone();
        for (int[] t : times) {
            to[fill[t[0]]] = t[1];
            weight[fill[t[0]]++] = t[2];
        }
        final int inf = Integer.MAX_VALUE;
        int[] dist = new int[n + 1];
        Arrays.fill(dist, inf);
        dist[k] = 0;
        // A (distance, node) pair packed in one long sorts by distance first.
        PriorityQueue<Long> pq = new PriorityQueue<>();
        pq.add((long) k);
        while (!pq.isEmpty()) {
            long top = pq.poll();
            int d = (int) (top >>> 32), u = (int) top;
            // A stale entry: u was already settled with a smaller time.
            if (d > dist[u]) {
                continue;
            }
            for (int e = start[u]; e < start[u + 1]; ++e) {
                int v = to[e], nd = d + weight[e];
                if (nd < dist[v]) {
                    dist[v] = nd;
                    pq.add(((long) nd << 32) | v);
                }
            }
        }
        // The last node to hear the signal decides; one that never hears it makes it -1.
        int ans = 0;
        for (int v = 1; v <= n; ++v) {
            ans = Math.max(ans, dist[v]);
        }
        return ans == inf ? -1 : ans;
    }
}
