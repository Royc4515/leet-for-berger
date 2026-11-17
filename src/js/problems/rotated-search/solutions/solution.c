// O(log n) time - at least one half of a rotated array is sorted; range-check the target there.
int search(int* nums, int numsSize, int target) {
    int n = numsSize;
    int left = 0, right = n - 1;
    // Narrow to one index that holds the target if it exists anywhere.
    while (left < right) {
        int mid = (left + right) >> 1;
        if (nums[0] <= nums[mid]) {
            // nums[0..mid] is sorted.
            if (nums[0] <= target && target <= nums[mid]) right = mid;
            else left = mid + 1;
        } else {
            // nums[mid..n-1] is sorted.
            if (nums[mid] < target && target <= nums[n - 1]) left = mid + 1;
            else right = mid;
        }
    }
    return nums[left] == target ? left : -1;
}
