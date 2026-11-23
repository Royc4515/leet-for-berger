class Solution {
public:
    // O(n) time - only the two largest numbers of a digit-sum group can form its best pair, so
    // remembering the largest number seen per digit sum (at most 81 sums) is enough.
    int maximumSum(vector<int>& nums) {
        int largest[82] = {0};
        int best = -1;
        for (int v : nums) {
            int s = 0;
            for (int x = v; x > 0; x /= 10) s += x % 10;
            // 0 means "nothing seen yet": every number is at least 1. The sum is at most 2 * 10^9,
            // which still fits in an int.
            if (largest[s] > 0) best = max(best, largest[s] + v);
            largest[s] = max(largest[s], v);
        }
        return best;
    }
};
