// O(E log E + Q log Q) - answer the queries offline in increasing limit. The usable edge set
// only grows with the limit, so one union-find, fed edges in increasing length, serves every
// query.
static int** sortRows;

// Sorts row indexes by the third column; qsort has no context argument, hence the static.
static int cmpByLength(const void* a, const void* b) {
    int x = sortRows[*(const int*)a][2], y = sortRows[*(const int*)b][2];
    return (x > y) - (x < y);
}

static int findRoot(int* p, int x) {
    // Iterative with path halving: no recursion depth to worry about on a path graph.
    while (p[x] != x) {
        p[x] = p[p[x]];
        x = p[x];
    }
    return x;
}

bool* distanceLimitedPathsExist(int n, int** edgeList, int edgeListSize, int* edgeListColSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
    int* p = malloc(sizeof(int) * n);
    int* size = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) {
        p[i] = i;
        size[i] = 1;
    }
    int* eid = malloc(sizeof(int) * edgeListSize);
    for (int i = 0; i < edgeListSize; i++) eid[i] = i;
    sortRows = edgeList;
    qsort(eid, edgeListSize, sizeof(int), cmpByLength);
    // Sorting indexes, not the queries, keeps track of where each answer belongs.
    int* qid = malloc(sizeof(int) * queriesSize);
    for (int i = 0; i < queriesSize; i++) qid[i] = i;
    sortRows = queries;
    qsort(qid, queriesSize, sizeof(int), cmpByLength);
    bool* ans = malloc(sizeof(bool) * queriesSize);
    int j = 0;
    for (int k = 0; k < queriesSize; k++) {
        int* q = queries[qid[k]];
        // Strictly shorter: an edge equal to the limit stays out.
        while (j < edgeListSize && edgeList[eid[j]][2] < q[2]) {
            int u = findRoot(p, edgeList[eid[j]][0]), v = findRoot(p, edgeList[eid[j]][1]);
            if (u != v) {
                if (size[u] < size[v]) {
                    int t = u;
                    u = v;
                    v = t;
                }
                p[v] = u;
                size[u] += size[v];
            }
            j++;
        }
        ans[qid[k]] = findRoot(p, q[0]) == findRoot(p, q[1]);
    }
    free(p);
    free(size);
    free(eid);
    free(qid);
    *returnSize = queriesSize;
    return ans;
}
