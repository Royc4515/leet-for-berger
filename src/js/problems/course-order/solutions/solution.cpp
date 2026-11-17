// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0210.Course%20Schedule%20II/Solution.cpp
class Solution {
public:
    // O((V + E) log V) time - Kahn's algorithm with a min-heap instead of a FIFO queue, so the
    // smallest available course is always taken next, which yields the smallest order.
    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> g(numCourses);
        vector<int> indeg(numCourses);
        for (auto& p : prerequisites) {
            int a = p[0], b = p[1];
            g[b].push_back(a);
            ++indeg[a];
        }
        // priority_queue is a max-heap by default; greater<int> turns it into a min-heap.
        priority_queue<int, vector<int>, greater<int>> q;
        for (int i = 0; i < numCourses; ++i) {
            if (indeg[i] == 0) q.push(i);
        }
        vector<int> ans;
        while (!q.empty()) {
            int i = q.top();
            q.pop();
            ans.push_back(i);
            for (int j : g[i]) {
                if (--indeg[j] == 0) q.push(j);
            }
        }
        // Courses on a cycle are never released, so a short order means no valid order exists.
        return (int)ans.size() == numCourses ? ans : vector<int>();
    }
};
