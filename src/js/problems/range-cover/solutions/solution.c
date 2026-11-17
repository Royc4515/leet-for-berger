// O(N log N) time - merge every value with its list index, then slide a window over the merged
// order: grow on the right, shrink from the left while all k lists are still covered.
typedef struct {
    int val, list;
} Item;

static int byValue(const void* x, const void* y) {
    int a = ((const Item*)x)->val, b = ((const Item*)y)->val;
    // Comparisons instead of a - b, which is the habit that avoids overflow bugs.
    return (a > b) - (a < b);
}

int* smallestRange(int** nums, int numsSize, int* numsColSize, int* returnSize) {
    int k = numsSize, n = 0;
    for (int i = 0; i < k; i++) n += numsColSize[i];
    Item* t = malloc(sizeof(Item) * n);
    for (int i = 0, j = 0; i < k; i++) {
        for (int c = 0; c < numsColSize[i]; c++) {
            t[j].val = nums[i][c];
            t[j].list = i;
            j++;
        }
    }
    qsort(t, n, sizeof(Item), byValue);
    int* have = calloc(k, sizeof(int));
    int covered = 0, left = 0;
    int* ans = malloc(sizeof(int) * 2);
    int found = 0;
    for (int r = 0; r < n; r++) {
        int b = t[r].val;
        if (have[t[r].list]++ == 0) covered++;
        while (covered == k) {
            int a = t[left].val;
            // Strictly narrower only: b never decreases, so an equally wide window found later
            // starts later, and ties must go to the smaller start.
            if (!found || b - a < ans[1] - ans[0]) {
                ans[0] = a;
                ans[1] = b;
                found = 1;
            }
            if (--have[t[left].list] == 0) covered--;
            left++;
        }
    }
    free(t);
    free(have);
    *returnSize = 2;
    return ans;
}
