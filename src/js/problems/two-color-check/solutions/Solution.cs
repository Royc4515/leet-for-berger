public class Solution {
    // O(V + E) time - color each component by BFS with alternating colors (1 and -1); BFS keeps
    // a 10^5-node path off the call stack.
    public bool IsBipartite(int[][] graph) {
        int n = graph.Length;
        var color = new int[n];
        var q = new Queue<int>();
        // Every node is a possible start: the graph may be disconnected.
        for (int i = 0; i < n; ++i) {
            if (color[i] != 0) continue;
            color[i] = 1;
            q.Enqueue(i);
            while (q.Count > 0) {
                int a = q.Dequeue();
                foreach (int b in graph[a]) {
                    if (color[b] == color[a]) return false;
                    if (color[b] == 0) {
                        color[b] = -color[a];
                        q.Enqueue(b);
                    }
                }
            }
        }
        return true;
    }
}
