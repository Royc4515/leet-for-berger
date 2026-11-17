// O(n) time - reachable indices always form a prefix, so its right end says everything.
bool canJump(int* nums, int numsSize) {
    int reach = 0;
    for (int i = 0; i < numsSize; i++) {
        // Standing past the farthest reachable index means no path ever got here.
        if (reach < i) return false;
        if (i + nums[i] > reach) reach = i + nums[i];
    }
    return true;
}
