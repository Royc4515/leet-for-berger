// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1800-1899/1822.Sign%20of%20the%20Product%20of%20an%20Array/Solution.c
// O(n) time, O(1) space - track only the sign; a running product overflows any integer type.
int productSign(int* nums, int numsSize) {
    int ans = 1;
    for (int i = 0; i < numsSize; i++) {
        // A zero decides the answer wherever it appears.
        if (nums[i] == 0) {
            return 0;
        }
        if (nums[i] < 0) {
            ans = -ans;
        }
    }
    return ans;
}
