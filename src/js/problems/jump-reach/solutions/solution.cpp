// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0055.Jump%20Game/Solution.cpp
class Solution {
public:
    // O(n) time - reachable indices always form a prefix, so its right end says everything.
    bool canJump(vector<int>& nums) {
        int reach = 0;
        for (int i = 0; i < (int)nums.size(); ++i) {
            // Standing past the farthest reachable index means no path ever got here.
            if (reach < i) {
                return false;
            }
            reach = max(reach, i + nums[i]);
        }
        return true;
    }
};
