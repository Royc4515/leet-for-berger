// O(2^n * n) time - depth-first search over sorted values. Recording each partial subset on
// entry, before it is extended, puts every prefix ahead of its extensions: lexicographic order.
static int cmpInt(const void* x, const void* y) {
    int a = *(const int*)x, b = *(const int*)y;
    return (a > b) - (a < b);
}

static int* vals;
static int valsN;
static int path[32];
static int** out;
static int* outCols;
static int outN;

static void dfs(int start, int depth) {
    int* s = malloc(sizeof(int) * (depth ? depth : 1));
    memcpy(s, path, sizeof(int) * depth);
    out[outN] = s;
    outCols[outN++] = depth;
    for (int i = start; i < valsN; i++) {
        path[depth] = vals[i];
        dfs(i + 1, depth + 1);
    }
}

int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    vals = malloc(sizeof(int) * numsSize);
    memcpy(vals, nums, sizeof(int) * numsSize);
    qsort(vals, numsSize, sizeof(int), cmpInt);
    valsN = numsSize;
    // Exactly 2^n subsets, so the result can be sized up front.
    int total = 1 << numsSize;
    out = malloc(sizeof(int*) * total);
    outCols = malloc(sizeof(int) * total);
    outN = 0;
    dfs(0, 0);
    free(vals);
    *returnSize = outN;
    *returnColumnSizes = outCols;
    return out;
}
