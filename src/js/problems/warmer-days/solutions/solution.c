// O(n) time - a stack of days still waiting; their temperatures never rise toward the top.
int* dailyTemperatures(int* temperatures, int temperaturesSize, int* returnSize) {
    int n = temperaturesSize;
    // calloc zero-fills, which is already the answer for days that are never answered.
    int* answer = calloc(n ? n : 1, sizeof(int));
    int* waiting = malloc(sizeof(int) * (n ? n : 1));
    int top = 0;
    for (int i = 0; i < n; i++) {
        // Today answers every waiting day that is strictly cooler; equal days keep waiting.
        while (top > 0 && temperatures[waiting[top - 1]] < temperatures[i]) {
            int d = waiting[--top];
            answer[d] = i - d;
        }
        waiting[top++] = i;
    }
    free(waiting);
    *returnSize = n;
    return answer;
}
