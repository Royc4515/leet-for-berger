class Solution {
public:
    // O((V + E) log V) - Dijkstra with a binary heap. Delays are never negative, so the node
    // with the smallest tentative time can no longer improve once it is popped.
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int, int>>> adj(n + 1);
        for (auto& t : times) adj[t[0]].emplace_back(t[1], t[2]);
        const int inf = INT_MAX;
        vector<int> dist(n + 1, inf);
        dist[k] = 0;
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;
        pq.emplace(0, k);
        while (!pq.empty()) {
            auto [d, u] = pq.top();
            pq.pop();
            // A stale entry: u was already settled with a smaller time.
            if (d > dist[u]) continue;
            for (auto [v, w] : adj[u]) {
                if (d + w < dist[v]) {
                    dist[v] = d + w;
                    pq.emplace(dist[v], v);
                }
            }
        }
        // The last node to hear the signal decides; one that never hears it makes it -1.
        int ans = *max_element(dist.begin() + 1, dist.end());
        return ans == inf ? -1 : ans;
    }
};
