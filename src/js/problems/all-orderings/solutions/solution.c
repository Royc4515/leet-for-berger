// O(n! * n) time - fill positions left to right with any unused value. Sorting first and trying
// values in ascending order emits the permutations in lexicographic order.
static int cmpInt(const void* x, const void* y) {
    int a = *(const int*)x, b = *(const int*)y;
    return (a > b) - (a < b);
}

static int* vals;
static int valsN;
static bool used[16];
static int path[16];
static int** out;
static int outN;

static void dfs(int i) {
    if (i == valsN) {
        out[outN] = malloc(sizeof(int) * valsN);
        memcpy(out[outN++], path, sizeof(int) * valsN);
        return;
    }
    for (int j = 0; j < valsN; j++) {
        if (!used[j]) {
            used[j] = true;
            path[i] = vals[j];
            dfs(i + 1);
            // Release the value so sibling branches can place it later.
            used[j] = false;
        }
    }
}

int** permute(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    vals = malloc(sizeof(int) * numsSize);
    memcpy(vals, nums, sizeof(int) * numsSize);
    qsort(vals, numsSize, sizeof(int), cmpInt);
    valsN = numsSize;
    // Exactly n! orderings, so the result can be sized up front.
    int total = 1;
    for (int k = 2; k <= numsSize; k++) total *= k;
    out = malloc(sizeof(int*) * total);
    outN = 0;
    dfs(0);
    free(vals);
    *returnSize = outN;
    *returnColumnSizes = malloc(sizeof(int) * total);
    for (int k = 0; k < total; k++) (*returnColumnSizes)[k] = numsSize;
    return out;
}
