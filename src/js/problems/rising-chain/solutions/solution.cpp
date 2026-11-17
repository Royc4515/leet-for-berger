class Solution {
public:
    // O(n log n) time - tails[k] is the smallest last value of any increasing run of length k + 1.
    int lengthOfLis(vector<int>& nums) {
        vector<int> tails;
        for (int x : nums) {
            // lower_bound (first tail >= x), not upper_bound: an equal value must not extend a run.
            auto it = lower_bound(tails.begin(), tails.end(), x);
            if (it == tails.end()) {
                tails.push_back(x);
            } else {
                // A smaller ending for the same length can only help later elements.
                *it = x;
            }
        }
        return tails.size();
    }
};
