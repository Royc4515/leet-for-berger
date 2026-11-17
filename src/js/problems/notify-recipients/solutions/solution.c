// C has no hash map, so sort and binary search instead: O((M + R + K) log) time, O(M + R) space.
typedef struct { int group; int user; } Membership;

static int cmpInt(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}

static int cmpMembership(const void* a, const void* b) {
    int x = ((const Membership*)a)->group, y = ((const Membership*)b)->group;
    return (x > y) - (x < y);
}

int* notifyRecipients(int** users, int usersSize, int* usersColSize, char** requests, int requestsSize, int* returnSize) {
    int m = 0;
    for (int i = 0; i < usersSize; i++) m += usersColSize[i] - 1;
    Membership* pairs = malloc(sizeof(Membership) * (m ? m : 1));
    int* known = malloc(sizeof(int) * usersSize);
    int k = 0;
    for (int i = 0; i < usersSize; i++) {
        known[i] = users[i][0];
        for (int j = 1; j < usersColSize[i]; j++) pairs[k++] = (Membership){ users[i][j], users[i][0] };
    }
    qsort(known, usersSize, sizeof(int), cmpInt);
    qsort(pairs, m, sizeof(Membership), cmpMembership);

    int* groups = malloc(sizeof(int) * (requestsSize ? requestsSize : 1));
    int* out = malloc(sizeof(int) * (m + requestsSize + 1));
    int g = 0, o = 0;
    for (int r = 0; r < requestsSize; r++) {
        int id = atoi(strchr(requests[r], ':') + 1);
        if (requests[r][0] == 'u') {
            if (bsearch(&id, known, usersSize, sizeof(int), cmpInt)) out[o++] = id;
        } else {
            groups[g++] = id;
        }
    }
    // Sorting the requested groups lets each distinct group be walked exactly once.
    qsort(groups, g, sizeof(int), cmpInt);
    for (int i = 0; i < g; i++) {
        if (i > 0 && groups[i] == groups[i - 1]) continue;
        int lo = 0, hi = m;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (pairs[mid].group < groups[i]) lo = mid + 1; else hi = mid;
        }
        while (lo < m && pairs[lo].group == groups[i]) out[o++] = pairs[lo++].user;
    }
    qsort(out, o, sizeof(int), cmpInt);
    int n = 0;
    for (int i = 0; i < o; i++) if (n == 0 || out[i] != out[n - 1]) out[n++] = out[i];
    free(pairs);
    free(known);
    free(groups);
    *returnSize = n;
    return out;
}
