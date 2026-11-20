// O(n) time, O(1) space - a candidate and a tally; every different value cancels one copy of it.
int majorityElement(int* nums, int numsSize) {
    int candidate = 0, tally = 0;
    for (int i = 0; i < numsSize; i++) {
        // The prefix so far cancelled out evenly, so the majority is still the majority of the rest.
        if (tally == 0) candidate = nums[i];
        tally += nums[i] == candidate ? 1 : -1;
    }
    return candidate;
}
