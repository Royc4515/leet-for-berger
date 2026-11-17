// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1500-1599/1584.Min%20Cost%20to%20Connect%20All%20Points/Solution.cpp
class Solution {
public:
    // O(n^2) - Prim's algorithm on the complete graph without building it: dist[k] is the
    // cheapest wire from outside point k into the tree, computed on the fly. Vectors, not
    // stack arrays: a variable-length n x n array is not standard C++ and can overflow.
    int minCostConnectPoints(vector<vector<int>>& points) {
        int n = points.size();
        vector<int> dist(n, INT_MAX);
        vector<bool> vis(n, false);
        dist[0] = 0;
        int ans = 0;
        for (int i = 0; i < n; ++i) {
            int j = -1;
            for (int k = 0; k < n; ++k) {
                if (!vis[k] && (j == -1 || dist[k] < dist[j])) {
                    j = k;
                }
            }
            vis[j] = true;
            ans += dist[j];
            int x = points[j][0], y = points[j][1];
            for (int k = 0; k < n; ++k) {
                if (!vis[k]) {
                    dist[k] = min(dist[k], abs(points[k][0] - x) + abs(points[k][1] - y));
                }
            }
        }
        return ans;
    }
};
