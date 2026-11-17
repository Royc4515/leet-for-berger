// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0207.Course%20Schedule/Solution.java
import java.util.*;

class Solution {
    // O(V + E) time - Kahn's algorithm; iterative, so 10^5-long chains need no deep recursion.
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<Integer>[] g = new List[numCourses];
        Arrays.setAll(g, k -> new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (var p : prerequisites) {
            int a = p[0], b = p[1];
            g[b].add(a);
            ++indeg[a];
        }
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < numCourses; ++i) {
            if (indeg[i] == 0) q.offer(i);
        }
        int taken = 0;
        while (!q.isEmpty()) {
            int i = q.poll();
            ++taken;
            for (int j : g[i]) {
                if (--indeg[j] == 0) q.offer(j);
            }
        }
        // Courses on a cycle never reach in-degree 0, so they are never taken.
        return taken == numCourses;
    }
}
