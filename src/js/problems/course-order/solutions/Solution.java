// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0210.Course%20Schedule%20II/Solution.java
import java.util.*;

class Solution {
    // O((V + E) log V) time - Kahn's algorithm with a min-heap instead of a FIFO queue, so the
    // smallest available course is always taken next, which yields the smallest order.
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<Integer>[] g = new List[numCourses];
        Arrays.setAll(g, k -> new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (var p : prerequisites) {
            int a = p[0], b = p[1];
            g[b].add(a);
            ++indeg[a];
        }
        PriorityQueue<Integer> q = new PriorityQueue<>();
        for (int i = 0; i < numCourses; ++i) {
            if (indeg[i] == 0) q.offer(i);
        }
        int[] ans = new int[numCourses];
        int cnt = 0;
        while (!q.isEmpty()) {
            int i = q.poll();
            ans[cnt++] = i;
            for (int j : g[i]) {
                if (--indeg[j] == 0) q.offer(j);
            }
        }
        // Courses on a cycle are never released, so a short order means no valid order exists.
        return cnt == numCourses ? ans : new int[0];
    }
}
