public class Solution {
    // O(n^2) - Prim's algorithm on the complete graph without building it: dist[k] is the
    // cheapest wire from outside point k into the tree, computed on the fly.
    public int MinCostConnectPoints(int[][] points) {
        int n = points.Length;
        var dist = new int[n];
        var vis = new bool[n];
        Array.Fill(dist, int.MaxValue);
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
                    dist[k] = Math.Min(dist[k], Math.Abs(points[k][0] - x) + Math.Abs(points[k][1] - y));
                }
            }
        }
        return ans;
    }
}
