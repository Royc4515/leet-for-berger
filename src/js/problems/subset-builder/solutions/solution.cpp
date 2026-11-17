// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0078.Subsets/Solution.cpp
class Solution {
public:
    // O(2^n * n) time - depth-first search over sorted values. Recording each partial subset on
    // entry, before it is extended, puts every prefix ahead of its extensions: lexicographic order.
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<int> a = nums;
        sort(a.begin(), a.end());
        vector<vector<int>> ans;
        vector<int> t;
        function<void(int)> dfs = [&](int start) -> void {
            ans.push_back(t);
            for (int i = start; i < (int)a.size(); i++) {
                t.push_back(a[i]);
                dfs(i + 1);
                t.pop_back();
            }
        };
        dfs(0);
        return ans;
    }
};
