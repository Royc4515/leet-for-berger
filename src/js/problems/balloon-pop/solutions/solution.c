// O(n^3) time, O(n^2) space. f[i][j] is the best total for popping everything strictly between
// borders i and j; the balloon popped last has the borders as neighbors, so the sides split.
int maxCoins(int* nums, int numsSize) {
    int n = numsSize, size = n + 2;
    int* arr = malloc(sizeof(int) * size);
    arr[0] = arr[n + 1] = 1;
    for (int i = 0; i < n; i++) arr[i + 1] = nums[i];
    // One flat block: f[i][j] lives at f[i * size + j].
    int* f = calloc((size_t)size * size, sizeof(int));
    for (int i = n - 1; i >= 0; i--) {
        for (int j = i + 2; j <= n + 1; j++) {
            int best = 0;
            for (int k = i + 1; k < j; k++) {
                int total = f[i * size + k] + f[k * size + j] + arr[i] * arr[k] * arr[j];
                if (total > best) best = total;
            }
            f[i * size + j] = best;
        }
    }
    int answer = f[n + 1];
    free(arr);
    free(f);
    return answer;
}
