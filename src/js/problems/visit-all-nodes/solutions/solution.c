// O(2^n * n^2) - BFS over states (node, set of visited nodes as a bitmask). A walk may revisit
// nodes, so the node alone is not a state. All n single-node states start at distance 0, which
// tries every starting node in one search.
int shortestPathLength(int n, int** edges, int edgesSize, int* edgesColSize) {
    // n <= 12, so an adjacency matrix is tiny.
    bool adj[12][12] = {{false}};
    for (int e = 0; e < edgesSize; e++) {
        adj[edges[e][0]][edges[e][1]] = true;
        adj[edges[e][1]][edges[e][0]] = true;
    }
    int full = (1 << n) - 1, states = n << n;
    // A state is packed as mask * n + node, which also indexes the visited table; every state
    // enters the queue at most once.
    bool* vis = calloc(states, sizeof(bool));
    int* q = malloc(sizeof(int) * states);
    int head = 0, tail = 0;
    for (int i = 0; i < n; i++) {
        vis[(1 << i) * n + i] = true;
        q[tail++] = (1 << i) * n + i;
    }
    int ans = 0;
    for (;; ans++) {
        // One BFS layer per step, so ans is the walk length of every state in it.
        int layerEnd = tail;
        bool done = false;
        while (head < layerEnd) {
            int state = q[head++];
            int i = state % n, st = state / n;
            if (st == full) {
                done = true;
                break;
            }
            for (int j = 0; j < n; j++) {
                if (!adj[i][j]) continue;
                int code = (st | 1 << j) * n + j;
                if (!vis[code]) {
                    vis[code] = true;
                    q[tail++] = code;
                }
            }
        }
        if (done) break;
    }
    free(vis);
    free(q);
    return ans;
}
