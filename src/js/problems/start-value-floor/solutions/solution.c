// O(n) time, O(1) space: after k steps the total is start + prefix[k], so the tightest moment is
// the lowest prefix sum. The lowest starts at 0 ("no steps yet") so the answer is at least 1.
int minStartValue(int* nums, int numsSize) {
    int total = 0; // |total| <= 10^5 * 10^4 = 10^9, within an int
    int lowest = 0;
    for (int i = 0; i < numsSize; i++) {
        total += nums[i];
        if (total < lowest) lowest = total;
    }
    return 1 - lowest;
}
