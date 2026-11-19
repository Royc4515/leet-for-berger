// O(C + 26^2): neighbors give one "x before y" edge at their first difference, then Kahn's
// algorithm always takes the smallest free letter, which yields the alphabetically first order.
char* glyphOrder(char** words, int wordsSize) {
    bool present[26] = {false};
    for (int i = 0; i < wordsSize; i++)
        for (const char* p = words[i]; *p; p++) present[*p - 'a'] = true;
    bool edge[26][26] = {{false}};
    int indeg[26] = {0};
    // The answer is malloc'ed for the caller; an empty string is a single '\0'.
    char* out = malloc(27);
    out[0] = '\0';
    for (int i = 0; i + 1 < wordsSize; i++) {
        const char* a = words[i];
        const char* b = words[i + 1];
        int j = 0;
        while (a[j] && a[j] == b[j]) j++;
        if (!a[j] || !b[j]) {
            // A word directly above its own proper prefix fits no order at all.
            if (a[j]) return out;
            continue;
        }
        int u = a[j] - 'a', v = b[j] - 'a';
        // Count a repeated fact once, or its indegree never drops to zero.
        if (!edge[u][v]) {
            edge[u][v] = true;
            indeg[v]++;
        }
    }
    int total = 0;
    for (int c = 0; c < 26; c++) total += present[c];
    bool used[26] = {false};
    int len = 0;
    while (len < total) {
        int pick = -1;
        for (int c = 0; c < 26 && pick == -1; c++)
            if (present[c] && !used[c] && indeg[c] == 0) pick = c;
        // Letters remain but none is free: they lie on a cycle.
        if (pick == -1) {
            out[0] = '\0';
            return out;
        }
        used[pick] = true;
        out[len++] = (char)('a' + pick);
        for (int v = 0; v < 26; v++)
            if (edge[pick][v]) indeg[v]--;
    }
    out[len] = '\0';
    return out;
}
