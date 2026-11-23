// O(n) time, O(1) space: track the three largest and two smallest numbers in one pass.
int maxTripleProduct(int* nums, int numsSize) {
    int max1 = -1001, max2 = -1001, max3 = -1001;
    int min1 = 1001, min2 = 1001;
    for (int i = 0; i < numsSize; i++) {
        int v = nums[i];
        if (v >= max1) {
            max3 = max2;
            max2 = max1;
            max1 = v;
        } else if (v >= max2) {
            max3 = max2;
            max2 = v;
        } else if (v > max3) {
            max3 = v;
        }
        if (v <= min1) {
            min2 = min1;
            min1 = v;
        } else if (v < min2) {
            min2 = v;
        }
    }
    int a = max1 * max2 * max3;
    int b = min1 * min2 * max1;
    return a > b ? a : b;
}
