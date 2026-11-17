// O(n) time, O(1) space - best(i) = max(best(i - 1), best(i - 2) + nums[i]).
int rob(int* nums, int numsSize) {
    int prev = 0, cur = 0; // totals stay <= 5 * 10^8, inside an int
    for (int i = 0; i < numsSize; i++) {
        // Either skip this house (keep cur) or take it on top of the best that skips its neighbor.
        int take = prev + nums[i];
        int next = take > cur ? take : cur;
        prev = cur;
        cur = next;
    }
    return cur;
}
