// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1929.Concatenation%20of%20Array/Solution.c
// O(n) - one malloc of 2n; each value is written to i and i + n.
int* doubleArray(int* nums, int numsSize, int* returnSize) {
    int* ans = malloc(sizeof(int) * numsSize * 2);
    for (int i = 0; i < numsSize; i++) {
        ans[i] = ans[i + numsSize] = nums[i];
    }
    *returnSize = numsSize * 2;
    return ans;
}
