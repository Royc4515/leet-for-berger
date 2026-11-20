// Nearly O(c + links + queries) - union-find once, then one forward-only pointer per grid.
static int findRoot(int* parent, int x) {
    // Path halving keeps the trees flat without recursion (a 10^5 line would be too deep).
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}

int* backupStations(int c, int** links, int linksSize, int* linksColSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
    int* parent = malloc(sizeof(int) * c);
    for (int i = 0; i < c; i++) parent[i] = i;
    for (int e = 0; e < linksSize; e++) parent[findRoot(parent, links[e][0] - 1)] = findRoot(parent, links[e][1] - 1);

    // The stations of the grid with root r sit in order[start[r] .. start[r + 1]), increasing:
    // visiting ids ascending while filling keeps each group sorted.
    int* root = malloc(sizeof(int) * c);
    int* start = calloc(c + 1, sizeof(int));
    for (int i = 0; i < c; i++) {
        root[i] = findRoot(parent, i);
        start[root[i] + 1]++;
    }
    for (int i = 0; i < c; i++) start[i + 1] += start[i];
    int* fill = malloc(sizeof(int) * c);
    memcpy(fill, start, sizeof(int) * c);
    int* order = malloc(sizeof(int) * c);
    for (int i = 0; i < c; i++) order[fill[root[i]]++] = i;
    int* ptr = fill;  // reuse: the fill positions are no longer needed, start them again
    memcpy(ptr, start, sizeof(int) * c);
    char* online = malloc(c);
    memset(online, 1, c);

    // At most one answer per query.
    int* answers = malloc(sizeof(int) * (queriesSize > 0 ? queriesSize : 1));
    int count = 0;
    for (int q = 0; q < queriesSize; q++) {
        int x = queries[q][1] - 1;
        if (queries[q][0] == 2) {
            online[x] = 0;
        } else if (online[x]) {
            answers[count++] = queries[q][1];
        } else {
            int r = root[x];
            // A station never comes back online, so the pointer only moves forward: every
            // station is skipped at most once over the whole run.
            while (ptr[r] < start[r + 1] && !online[order[ptr[r]]]) ptr[r]++;
            answers[count++] = ptr[r] < start[r + 1] ? order[ptr[r]] + 1 : -1;
        }
    }
    free(parent);
    free(root);
    free(start);
    free(fill);
    free(order);
    free(online);
    *returnSize = count;
    return answers;
}
