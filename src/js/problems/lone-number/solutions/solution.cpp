class Solution {
public:
    // O(n) time, O(1) space - x ^ x == 0 and XOR is order independent, so every pair cancels
    // and only the lone value survives the fold.
    int singleNumber(vector<int>& nums) {
        int x = 0;
        for (int v : nums) x ^= v;
        return x;
    }
};
