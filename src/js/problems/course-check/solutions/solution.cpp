// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0207.Course%20Schedule/Solution.cpp
class Solution {
public:
    // O(V + E) time - Kahn's algorithm; iterative, so 10^5-long chains need no deep recursion.
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> g(numCourses);
        vector<int> indeg(numCourses);
        for (auto& p : prerequisites) {
            int a = p[0], b = p[1];
            g[b].push_back(a);
            ++indeg[a];
        }
        queue<int> q;
        for (int i = 0; i < numCourses; ++i) {
            if (indeg[i] == 0) q.push(i);
        }
        int taken = 0;
        while (!q.empty()) {
            int i = q.front();
            q.pop();
            ++taken;
            for (int j : g[i]) {
                if (--indeg[j] == 0) q.push(j);
            }
        }
        // Courses on a cycle never reach in-degree 0, so they are never taken.
        return taken == numCourses;
    }
};
