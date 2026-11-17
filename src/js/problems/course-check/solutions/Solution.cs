// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0207.Course%20Schedule/Solution.cs
public class Solution {
    // O(V + E) time - Kahn's algorithm; iterative, so 10^5-long chains need no deep recursion.
    public bool CanFinish(int numCourses, int[][] prerequisites) {
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
        var q = new Queue<int>();
        for (int i = 0; i < numCourses; ++i) {
            if (indeg[i] == 0) q.Enqueue(i);
        }
        int taken = 0;
        while (q.Count > 0) {
            int i = q.Dequeue();
            ++taken;
            foreach (int j in g[i]) {
                if (--indeg[j] == 0) q.Enqueue(j);
            }
        }
        // Courses on a cycle never reach in-degree 0, so they are never taken.
        return taken == numCourses;
    }
}
