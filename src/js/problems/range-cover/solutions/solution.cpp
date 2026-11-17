// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0632.Smallest%20Range%20Covering%20Elements%20from%20K%20Lists/Solution.cpp
class Solution {
public:
    // O(N log N) time - merge every value with its list index, then slide a window over the
    // merged order: grow on the right, shrink from the left while all k lists are still covered.
    vector<int> smallestRange(vector<vector<int>>& nums) {
        int k = nums.size();
        vector<pair<int, int>> t;
        for (int i = 0; i < k; ++i) {
            for (int v : nums[i]) {
                t.push_back({v, i});
            }
        }
        sort(t.begin(), t.end());
        vector<int> have(k, 0);
        int covered = 0, j = 0;
        vector<int> ans;
        for (auto& [b, v] : t) {
            if (have[v]++ == 0) ++covered;
            while (covered == k) {
                int a = t[j].first, w = t[j].second;
                // Strictly narrower only: b never decreases, so an equally wide window found later
                // starts later, and ties must go to the smaller start.
                if (ans.empty() || b - a < ans[1] - ans[0]) ans = {a, b};
                if (--have[w] == 0) --covered;
                ++j;
            }
        }
        return ans;
    }
};
