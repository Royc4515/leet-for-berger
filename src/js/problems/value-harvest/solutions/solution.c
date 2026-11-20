// O(n + max(nums)) - taking a value takes all its copies, so each value is worth v * count[v],
// and it conflicts only with v - 1 and v + 1: house robber on the value line.
int maxPoints(int* nums, int numsSize) {
    int max = 0;
    for (int i = 0; i < numsSize; i++) {
        if (nums[i] > max) max = nums[i];
    }
    int* total = calloc(max + 1, sizeof(int));
    for (int i = 0; i < numsSize; i++) total[nums[i]] += nums[i];
    int skip = 0;  // best score using values up to v - 2
    int best = 0;  // best score using values up to v - 1
    for (int v = 1; v <= max; v++) {
        // Absent values have total 0, so a gap in the values lets both neighbours be taken.
        int take = skip + total[v];
        skip = best;
        if (take > best) best = take;
    }
    free(total);
    return best;
}
