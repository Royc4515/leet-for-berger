class Solution {
public:
    // O(m + n) time - two read heads; the smaller front value is always the next output.
    vector<int> mergeSorted(vector<int>& nums1, vector<int>& nums2) {
        vector<int> out;
        out.reserve(nums1.size() + nums2.size());
        size_t i = 0, j = 0;
        while (i < nums1.size() && j < nums2.size()) {
            // <= takes nums1 first on ties, which keeps the merge stable.
            out.push_back(nums1[i] <= nums2[j] ? nums1[i++] : nums2[j++]);
        }
        // At most one of these runs, and what is left is already sorted.
        out.insert(out.end(), nums1.begin() + i, nums1.end());
        out.insert(out.end(), nums2.begin() + j, nums2.end());
        return out;
    }
};
