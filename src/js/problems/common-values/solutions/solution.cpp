// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0349.Intersection%20of%20Two%20Arrays/Solution.cpp
class Solution {
public:
    // O(n + m + k log k) time: set lookups replace the O(n * m) nested loop.
    vector<int> commonValues(vector<int>& nums1, vector<int>& nums2) {
        unordered_set<int> inFirst(nums1.begin(), nums1.end());
        vector<int> ans;
        for (int x : nums2) {
            // Erasing a match means a repeat in nums2 cannot report it again.
            if (inFirst.erase(x)) {
                ans.push_back(x);
            }
        }
        sort(ans.begin(), ans.end());
        return ans;
    }
};
