public class Solution {
    // O(2^n * n^2) - BFS over states (node, set of visited nodes as a bitmask). A walk may
    // revisit nodes, so the node alone is not a state. All n single-node states start at
    // distance 0, which tries every starting node in one search.
    public int ShortestPathLength(int n, int[][] edges) {
        var graph = new List<int>[n];
        for (int i = 0; i < n; ++i) {
            graph[i] = new List<int>();
        }
        foreach (var e in edges) {
            graph[e[0]].Add(e[1]);
            graph[e[1]].Add(e[0]);
        }
        int full = (1 << n) - 1;
        var vis = new bool[n, 1 << n];
        var q = new Queue<(int Node, int Mask)>();
        for (int i = 0; i < n; ++i) {
            q.Enqueue((i, 1 << i));
            vis[i, 1 << i] = true;
        }
        for (int ans = 0; ; ++ans) {
            // One BFS layer per step, so ans is the walk length of every state in it.
            for (int k = q.Count; k > 0; --k) {
                var (i, st) = q.Dequeue();
                if (st == full) {
                    return ans;
                }
                foreach (int j in graph[i]) {
                    int nst = st | 1 << j;
                    if (!vis[j, nst]) {
                        vis[j, nst] = true;
                        q.Enqueue((j, nst));
                    }
                }
            }
        }
    }
}
