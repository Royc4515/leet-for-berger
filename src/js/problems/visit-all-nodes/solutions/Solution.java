// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0847.Shortest%20Path%20Visiting%20All%20Nodes/Solution.java
import java.util.*;

class Solution {
    // O(2^n * n^2) - BFS over states (node, set of visited nodes as a bitmask). A walk may
    // revisit nodes, so the node alone is not a state. All n single-node states start at
    // distance 0, which tries every starting node in one search.
    public int shortestPathLength(int n, int[][] edges) {
        List<Integer>[] graph = new List[n];
        Arrays.setAll(graph, k -> new ArrayList<>());
        for (int[] e : edges) {
            graph[e[0]].add(e[1]);
            graph[e[1]].add(e[0]);
        }
        Deque<int[]> q = new ArrayDeque<>();
        boolean[][] vis = new boolean[n][1 << n];
        for (int i = 0; i < n; ++i) {
            q.offer(new int[] {i, 1 << i});
            vis[i][1 << i] = true;
        }
        for (int ans = 0;; ++ans) {
            // One BFS layer per step, so ans is the walk length of every state in it.
            for (int k = q.size(); k > 0; --k) {
                var p = q.poll();
                int i = p[0], st = p[1];
                if (st == (1 << n) - 1) {
                    return ans;
                }
                for (int j : graph[i]) {
                    int nst = st | 1 << j;
                    if (!vis[j][nst]) {
                        vis[j][nst] = true;
                        q.offer(new int[] {j, nst});
                    }
                }
            }
        }
    }
}
