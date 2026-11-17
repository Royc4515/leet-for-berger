// O(E log E) for E emails - union-find over account indexes: each email links its account to
// the first account seen with it, which merges transitively connected accounts. C has no hash
// map, so emails go in a small open-addressing table; strcmp gives the required byte order.
typedef struct { char* email; int root; } Entry;
typedef struct { char** row; int len; } Group;

static int findRoot(int* p, int x) {
    while (p[x] != x) {
        p[x] = p[p[x]];
        x = p[x];
    }
    return x;
}

static unsigned long hashStr(const char* s) {
    unsigned long h = 2166136261UL;
    for (; *s; s++) h = (h ^ (unsigned char)*s) * 16777619UL;
    return h;
}

// Sorting by (root, email) makes each person's emails one contiguous, sorted run.
static int cmpEntry(const void* a, const void* b) {
    const Entry* x = a;
    const Entry* y = b;
    if (x->root != y->root) return x->root < y->root ? -1 : 1;
    return strcmp(x->email, y->email);
}

static int cmpGroup(const void* a, const void* b) {
    const Group* x = a;
    const Group* y = b;
    int c = strcmp(x->row[0], y->row[0]);
    return c ? c : strcmp(x->row[1], y->row[1]);
}

char*** accountsMerge(char*** accounts, int accountsSize, int* accountsColSize, int* returnSize, int** returnColumnSizes) {
    int n = accountsSize;
    int* p = malloc(sizeof(int) * n);
    int* size = malloc(sizeof(int) * n);
    int total = 0;
    for (int i = 0; i < n; i++) {
        p[i] = i;
        size[i] = 1;
        total += accountsColSize[i] - 1;
    }
    int cap = 1;
    while (cap < 2 * total) cap <<= 1;
    int mask = cap - 1;
    char** keys = calloc(cap, sizeof(char*));
    int* owner = malloc(sizeof(int) * cap);
    for (int i = 0; i < n; i++) {
        for (int j = 1; j < accountsColSize[i]; j++) {
            char* email = accounts[i][j];
            unsigned long h = hashStr(email) & mask;
            while (keys[h] && strcmp(keys[h], email) != 0) h = (h + 1) & mask;
            if (!keys[h]) {
                keys[h] = email;
                owner[h] = i;
                continue;
            }
            int pa = findRoot(p, i), pb = findRoot(p, owner[h]);
            if (pa == pb) continue;
            // Union by size keeps the trees shallow.
            if (size[pa] < size[pb]) {
                int t = pa;
                pa = pb;
                pb = t;
            }
            p[pb] = pa;
            size[pa] += size[pb];
        }
    }
    // Each table slot is one distinct email, so duplicates are already gone.
    Entry* entries = malloc(sizeof(Entry) * (total ? total : 1));
    int m = 0;
    for (int h = 0; h < cap; h++) {
        if (keys[h]) {
            entries[m].email = keys[h];
            entries[m].root = findRoot(p, owner[h]);
            m++;
        }
    }
    qsort(entries, m, sizeof(Entry), cmpEntry);
    Group* groups = malloc(sizeof(Group) * (m ? m : 1));
    int g = 0;
    for (int s = 0; s < m;) {
        int e = s;
        while (e < m && entries[e].root == entries[s].root) e++;
        char** row = malloc(sizeof(char*) * (e - s + 1));
        row[0] = accounts[entries[s].root][0];
        for (int k = s; k < e; k++) row[k - s + 1] = entries[k].email;
        groups[g].row = row;
        groups[g].len = e - s + 1;
        g++;
        s = e;
    }
    qsort(groups, g, sizeof(Group), cmpGroup);
    char*** out = malloc(sizeof(char**) * (g ? g : 1));
    *returnColumnSizes = malloc(sizeof(int) * (g ? g : 1));
    for (int k = 0; k < g; k++) {
        out[k] = groups[k].row;
        (*returnColumnSizes)[k] = groups[k].len;
    }
    *returnSize = g;
    free(p);
    free(size);
    free(keys);
    free(owner);
    free(entries);
    free(groups);
    return out;
}
