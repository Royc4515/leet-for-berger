// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0785.Is%20Graph%20Bipartite/Solution.java
import java.util.*;

class Solution {
    // O(V + E) time - color each component by BFS with alternating colors (1 and -1); BFS keeps
    // a 10^5-node path off the call stack.
    public boolean isBipartite(int[][] graph) {
        int n = graph.length;
        int[] color = new int[n];
        int[] q = new int[n];
        // Every node is a possible start: the graph may be disconnected.
        for (int i = 0; i < n; ++i) {
            if (color[i] != 0) continue;
            color[i] = 1;
            int head = 0, tail = 0;
            q[tail++] = i;
            while (head < tail) {
                int a = q[head++];
                for (int b : graph[a]) {
                    if (color[b] == color[a]) return false;
                    if (color[b] == 0) {
                        color[b] = -color[a];
                        q[tail++] = b;
                    }
                }
            }
        }
        return true;
    }
}
