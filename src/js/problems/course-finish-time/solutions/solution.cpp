// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2000-2099/2050.Parallel%20Courses%20III/Solution.cpp
class Solution {
public:
    // O(n + m) - Kahn's topological order. f[i] is the month course i finishes: its own time
    // plus the latest finish among its prerequisites, final once all of them are processed.
    int minimumTime(int n, vector<vector<int>>& relations, vector<int>& time) {
        vector<vector<int>> g(n);
        vector<int> indeg(n);
        for (auto& e : relations) {
            int a = e[0] - 1, b = e[1] - 1;
            g[a].push_back(b);
            ++indeg[b];
        }
        queue<int> q;
        vector<int> f(n);
        int ans = 0;
        for (int i = 0; i < n; ++i) {
            if (indeg[i] == 0) {
                q.push(i);
                f[i] = time[i];
                ans = max(ans, time[i]);
            }
        }
        while (!q.empty()) {
            int i = q.front();
            q.pop();
            for (int j : g[i]) {
                f[j] = max(f[j], f[i] + time[j]);
                ans = max(ans, f[j]);
                if (--indeg[j] == 0) {
                    q.push(j);
                }
            }
        }
        return ans;
    }
};
