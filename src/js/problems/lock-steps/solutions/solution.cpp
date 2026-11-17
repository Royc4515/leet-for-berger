// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0752.Open%20the%20Lock/Solution.cpp
class Solution {
public:
    // O(10^4 * 8) - BFS over the 10^4 codes, stored as integers. One array marks both dead ends
    // and visited codes, so every check is O(1) however many dead ends there are.
    int openLock(vector<string>& deadends, string target) {
        int goal = stoi(target);
        if (goal == 0) return 0;
        vector<char> blocked(10000, 0);
        for (auto& d : deadends) blocked[stoi(d)] = 1;
        if (blocked[0]) return -1;
        blocked[0] = 1;
        queue<int> q{{0}};
        int ans = 0;
        while (!q.empty()) {
            ++ans;
            for (int n = q.size(); n > 0; --n) {
                int p = q.front();
                q.pop();
                for (int place = 1; place < 10000; place *= 10) {
                    int digit = p / place % 10;
                    // Turning up from 9 wraps to 0 and down from 0 wraps to 9.
                    for (int nd : {(digit + 1) % 10, (digit + 9) % 10}) {
                        int t = p + (nd - digit) * place;
                        if (t == goal) return ans;
                        if (!blocked[t]) {
                            blocked[t] = 1;
                            q.push(t);
                        }
                    }
                }
            }
        }
        return -1;
    }
};
