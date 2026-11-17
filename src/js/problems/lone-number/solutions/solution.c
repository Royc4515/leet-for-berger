// O(n) time, O(1) space - x ^ x == 0 and XOR is order independent, so every pair cancels and
// only the lone value survives the fold.
int singleNumber(int* nums, int numsSize) {
    int x = 0;
    for (int i = 0; i < numsSize; i++) x ^= nums[i];
    return x;
}
