// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0787.Cheapest%20Flights%20Within%20K%20Stops/Solution.cpp
class Solution {
public:
    // O(k * E) - Bellman-Ford limited to k + 1 rounds: after round j, dist holds the cheapest
    // cost using at most j flights.
    int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
        // Far above any real cost (at most 99 flights of 10^4) and safe to add a price to.
        const int inf = 0x3f3f3f3f;
        vector<int> dist(n, inf);
        vector<int> backup;
        dist[src] = 0;
        for (int i = 0; i < k + 1; ++i) {
            // Every flight reads the previous round's costs; relaxing in place could chain
            // several flights in one round and break the stop limit.
            backup = dist;
            bool changed = false;
            for (auto& e : flights) {
                int f = e[0], t = e[1], p = e[2];
                if (backup[f] + p < dist[t]) {
                    dist[t] = backup[f] + p;
                    changed = true;
                }
            }
            // Nothing improved, so more rounds cannot improve anything either.
            if (!changed) break;
        }
        return dist[dst] == inf ? -1 : dist[dst];
    }
};
