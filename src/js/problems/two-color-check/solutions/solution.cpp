// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0785.Is%20Graph%20Bipartite/Solution.cpp
class Solution {
public:
    // O(V + E) time - color each component by BFS with alternating colors (1 and -1); BFS keeps
    // a 10^5-node path off the call stack.
    bool isBipartite(vector<vector<int>>& graph) {
        int n = graph.size();
        vector<int> color(n, 0);
        // Every node is a possible start: the graph may be disconnected.
        for (int i = 0; i < n; ++i) {
            if (color[i]) continue;
            color[i] = 1;
            queue<int> q{{i}};
            while (!q.empty()) {
                int a = q.front();
                q.pop();
                for (int b : graph[a]) {
                    if (color[b] == color[a]) return false;
                    if (!color[b]) {
                        color[b] = -color[a];
                        q.push(b);
                    }
                }
            }
        }
        return true;
    }
};
