// O(n) time, O(1) space - xor every index 0..n with every value; present numbers cancel in pairs.
int missingNumber(int* nums, int numsSize) {
    // Start from n: the loop below only visits the indices 0..n-1.
    int result = numsSize;
    for (int i = 0; i < numsSize; i++) result ^= i ^ nums[i];
    return result;
}
