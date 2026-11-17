// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0046.Permutations/Solution.cpp
class Solution {
public:
    // O(n! * n) time - fill positions left to right with any unused value. Sorting first and
    // trying values in ascending order emits the permutations in lexicographic order.
    vector<vector<int>> permute(vector<int>& nums) {
        vector<int> a = nums;
        sort(a.begin(), a.end());
        int n = a.size();
        vector<vector<int>> ans;
        vector<int> t(n);
        vector<bool> vis(n);
        // std::function instead of a deducing-this lambda, which needs C++23.
        function<void(int)> dfs = [&](int i) -> void {
            if (i == n) {
                ans.emplace_back(t);
                return;
            }
            for (int j = 0; j < n; ++j) {
                if (!vis[j]) {
                    vis[j] = true;
                    t[i] = a[j];
                    dfs(i + 1);
                    // Release the value so sibling branches can place it later.
                    vis[j] = false;
                }
            }
        };
        dfs(0);
        return ans;
    }
};
