// O(n log n + m log m) time: C has no hash set, so sort both arrays and walk them with two
// pointers. Equal values meet side by side, and the answer comes out already ascending.
static int cmpInt(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    // Compare instead of subtracting: x - y overflows for values near +-10^9.
    return (x > y) - (x < y);
}

int* commonValues(int* nums1, int nums1Size, int* nums2, int nums2Size, int* returnSize) {
    qsort(nums1, nums1Size, sizeof(int), cmpInt);
    qsort(nums2, nums2Size, sizeof(int), cmpInt);
    int* ans = malloc(sizeof(int) * (nums1Size < nums2Size ? nums1Size : nums2Size));
    int k = 0;
    for (int i = 0, j = 0; i < nums1Size && j < nums2Size;) {
        if (nums1[i] < nums2[j]) {
            i++;
        } else if (nums1[i] > nums2[j]) {
            j++;
        } else {
            // Report a value once, even when both arrays repeat it.
            if (k == 0 || ans[k - 1] != nums1[i]) ans[k++] = nums1[i];
            i++;
            j++;
        }
    }
    *returnSize = k;
    return ans;
}
