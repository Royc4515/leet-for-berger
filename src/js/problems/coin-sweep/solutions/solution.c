// O(n) - peel the tree from the outside. A closed walk over the m nodes that must be visited
// crosses each of their m - 1 edges twice, so the answer is 2 * (m - 1).
int collectCoins(int* coins, int coinsSize, int** edges, int edgesSize, int* edgesColSize) {
    int n = coinsSize;
    int any = 0;
    for (int i = 0; i < n; i++) any |= coins[i] == 1;
    if (!any) return 0;
    // For each node: its degree and the xor of its neighbours' numbers. A leaf has one neighbour,
    // so its xor is that neighbour, and no adjacency lists are needed.
    int* deg = calloc(n, sizeof(int));
    int* xr = calloc(n, sizeof(int));
    for (int i = 0; i < edgesSize; i++) {
        int a = edges[i][0], b = edges[i][1];
        deg[a]++;
        deg[b]++;
        xr[a] ^= b;
        xr[b] ^= a;
    }
    char* gone = calloc(n, 1);
    int* queue = malloc(sizeof(int) * n);
    int alive = n, tail = 0;

    // Pass 1: a leaf without a coin is never worth visiting. Removing one may expose another.
    for (int v = 0; v < n; v++) {
        if (deg[v] == 1 && coins[v] == 0) {
            gone[v] = 1;
            queue[tail++] = v;
        }
    }
    for (int head = 0; head < tail; head++) {
        int v = queue[head];
        alive--;
        int p = xr[v];
        xr[p] ^= v;
        deg[p]--;
        if (deg[p] == 1 && coins[p] == 0 && !gone[p]) {
            gone[p] = 1;
            queue[tail++] = p;
        }
    }

    // Pass 2, twice: a coin within distance 2 of the walk is collected from there, so the two
    // outermost layers of nodes need not be visited, whatever they hold.
    for (int round = 0; round < 2; round++) {
        int count = 0;
        for (int v = 0; v < n; v++) {
            if (!gone[v] && deg[v] == 1) queue[count++] = v;
        }
        for (int i = 0; i < count; i++) {
            int v = queue[i];
            gone[v] = 1;
            alive--;
            // If the only neighbour was a leaf too (two nodes left), it is already gone.
            if (deg[v] == 1) {
                int p = xr[v];
                xr[p] ^= v;
                deg[p]--;
            }
        }
    }
    free(deg);
    free(xr);
    free(gone);
    free(queue);
    return alive > 1 ? 2 * (alive - 1) : 0;
}
