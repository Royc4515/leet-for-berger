// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0210.Course%20Schedule%20II/Solution.cs
public class Solution {
    // O((V + E) log V) time - Kahn's algorithm with a min-heap instead of a FIFO queue, so the
    // smallest available course is always taken next, which yields the smallest order.
    public int[] FindOrder(int numCourses, int[][] prerequisites) {
        var g = new List<int>[numCourses];
        for (int i = 0; i < numCourses; ++i) {
            g[i] = new List<int>();
        }
        var indeg = new int[numCourses];
        foreach (var p in prerequisites) {
            int a = p[0], b = p[1];
            g[b].Add(a);
            ++indeg[a];
        }
        // The course number is also its priority, so the queue pops the smallest one.
        var q = new PriorityQueue<int, int>();
        for (int i = 0; i < numCourses; ++i) {
            if (indeg[i] == 0) q.Enqueue(i, i);
        }
        var ans = new int[numCourses];
        var cnt = 0;
        while (q.Count > 0) {
            int i = q.Dequeue();
            ans[cnt++] = i;
            foreach (int j in g[i]) {
                if (--indeg[j] == 0) q.Enqueue(j, j);
            }
        }
        // Courses on a cycle are never released, so a short order means no valid order exists.
        return cnt == numCourses ? ans : new int[0];
    }
}
