class Solution {
public:
    // O(n) time, O(1) space - a candidate and a tally; every different value cancels one copy of it.
    int majorityElement(vector<int>& nums) {
        int candidate = 0, tally = 0;
        for (int v : nums) {
            // The prefix so far cancelled out evenly, so the majority is still the majority of the rest.
            if (tally == 0) candidate = v;
            tally += v == candidate ? 1 : -1;
        }
        return candidate;
    }
};
