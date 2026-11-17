// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0847.Shortest%20Path%20Visiting%20All%20Nodes/Solution.cpp
class Solution {
public:
    // O(2^n * n^2) - BFS over states (node, set of visited nodes as a bitmask). A walk may
    // revisit nodes, so the node alone is not a state. All n single-node states start at
    // distance 0, which tries every starting node in one search.
    int shortestPathLength(int n, vector<vector<int>>& edges) {
        vector<vector<int>> graph(n);
        for (auto& e : edges) {
            graph[e[0]].push_back(e[1]);
            graph[e[1]].push_back(e[0]);
        }
        queue<pair<int, int>> q;
        // A vector, not a variable-length stack array, which is not standard C++.
        vector<vector<bool>> vis(n, vector<bool>(1 << n, false));
        for (int i = 0; i < n; ++i) {
            q.emplace(i, 1 << i);
            vis[i][1 << i] = true;
        }
        for (int ans = 0;; ++ans) {
            // One BFS layer per step, so ans is the walk length of every state in it.
            for (int k = q.size(); k; --k) {
                auto [i, st] = q.front();
                q.pop();
                if (st == (1 << n) - 1) {
                    return ans;
                }
                for (int j : graph[i]) {
                    int nst = st | 1 << j;
                    if (!vis[j][nst]) {
                        vis[j][nst] = true;
                        q.emplace(j, nst);
                    }
                }
            }
        }
    }
};
