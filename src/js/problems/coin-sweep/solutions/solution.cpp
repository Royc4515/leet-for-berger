class Solution {
public:
    // O(n) - peel the tree from the outside. A closed walk over the m nodes that must be visited
    // crosses each of their m - 1 edges twice, so the answer is 2 * (m - 1).
    int collectCoins(vector<int>& coins, vector<vector<int>>& edges) {
        int n = coins.size();
        if (find(coins.begin(), coins.end(), 1) == coins.end()) return 0;
        // For each node: its degree and the xor of its neighbours' numbers. A leaf has one
        // neighbour, so its xor is that neighbour, and no adjacency lists are needed.
        vector<int> deg(n, 0), xr(n, 0);
        for (auto& e : edges) {
            deg[e[0]]++;
            deg[e[1]]++;
            xr[e[0]] ^= e[1];
            xr[e[1]] ^= e[0];
        }
        vector<char> gone(n, 0);
        int alive = n;

        // Pass 1: a leaf without a coin is never worth visiting. Removing one may expose another.
        vector<int> queue;
        for (int v = 0; v < n; v++) {
            if (deg[v] == 1 && coins[v] == 0) {
                gone[v] = 1;
                queue.push_back(v);
            }
        }
        for (size_t head = 0; head < queue.size(); head++) {
            int v = queue[head];
            alive--;
            int p = xr[v];
            xr[p] ^= v;
            deg[p]--;
            if (deg[p] == 1 && coins[p] == 0 && !gone[p]) {
                gone[p] = 1;
                queue.push_back(p);
            }
        }

        // Pass 2, twice: a coin within distance 2 of the walk is collected from there, so the two
        // outermost layers of nodes need not be visited, whatever they hold.
        for (int round = 0; round < 2; round++) {
            vector<int> leaves;
            for (int v = 0; v < n; v++) {
                if (!gone[v] && deg[v] == 1) leaves.push_back(v);
            }
            for (int v : leaves) {
                gone[v] = 1;
                alive--;
                // If the only neighbour was a leaf too (two nodes left), it is already gone.
                if (deg[v] == 1) {
                    int p = xr[v];
                    xr[p] ^= v;
                    deg[p]--;
                }
            }
        }
        return max(0, 2 * (alive - 1));
    }
};
