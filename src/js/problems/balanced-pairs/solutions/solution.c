// O(C * n) time for C answers: every path of the search is a valid prefix, so nothing is wasted.
typedef struct {
    char** items;
    int size, cap;
    char* path;
    int n, maxDepth;
} Search;

static void dfs(Search* st, int len, int opened, int closed) {
    if (len == 2 * st->n) {
        if (st->size == st->cap) {
            st->cap *= 2;
            st->items = realloc(st->items, sizeof(char*) * st->cap);
        }
        char* copy = malloc(len + 1);
        memcpy(copy, st->path, len);
        copy[len] = '\0';
        st->items[st->size++] = copy;
        return;
    }
    // Open while pairs remain and the depth (opened - closed) is under the limit.
    // "(" is tried first because it sorts before ")", which keeps the output in order.
    if (opened < st->n && opened - closed < st->maxDepth) {
        st->path[len] = '(';
        dfs(st, len + 1, opened + 1, closed);
    }
    // Close only while something is open.
    if (closed < opened) {
        st->path[len] = ')';
        dfs(st, len + 1, opened, closed + 1);
    }
}

char** balancedPairs(int n, int maxDepth, int* returnSize) {
    Search st = {malloc(sizeof(char*) * 16), 0, 16, malloc(2 * n + 1), n, maxDepth};
    dfs(&st, 0, 0, 0);
    free(st.path);
    *returnSize = st.size;
    return st.items;
}
