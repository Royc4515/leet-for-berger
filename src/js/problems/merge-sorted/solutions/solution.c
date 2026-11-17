// O(m + n) time - two read heads; the smaller front value is always the next output.
int* mergeSorted(int* nums1, int nums1Size, int* nums2, int nums2Size, int* returnSize) {
    int total = nums1Size + nums2Size;
    // At least one slot, so malloc never returns the NULL it may give for size 0.
    int* out = malloc(sizeof(int) * (total ? total : 1));
    int i = 0, j = 0, k = 0;
    while (i < nums1Size && j < nums2Size) {
        // <= takes nums1 first on ties, which keeps the merge stable.
        out[k++] = nums1[i] <= nums2[j] ? nums1[i++] : nums2[j++];
    }
    // At most one of these runs, and what is left is already sorted.
    while (i < nums1Size) out[k++] = nums1[i++];
    while (j < nums2Size) out[k++] = nums2[j++];
    *returnSize = total;
    return out;
}
