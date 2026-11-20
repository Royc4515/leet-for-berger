// O(n^2) worst case (a deeply nested hill re-slices and sorts at every level).
// Cut into top-level hills, rearrange inside each, then place the pieces largest first.
static int byDescending(const void* a, const void* b) {
    return strcmp(*(char* const*)b, *(char* const*)a);
}

// Rearranges the hill s[lo, hi), which may be empty. The result is malloc'ed.
static char* solve(const char* s, int lo, int hi) {
    int n = hi - lo;
    char** pieces = malloc(sizeof(char*) * (n / 2 + 1));
    int count = 0;
    int height = 0;
    int start = lo;
    for (int i = lo; i < hi; i++) {
        height += s[i] == '1' ? 1 : -1;
        if (height == 0) {
            // A piece is "1" + hill + "0": strip the outer pair before recursing, or the
            // recursion would never get smaller.
            char* inner = solve(s, start + 1, i);
            size_t len = strlen(inner);
            char* piece = malloc(len + 3);
            piece[0] = '1';
            memcpy(piece + 1, inner, len);
            piece[len + 1] = '0';
            piece[len + 2] = '\0';
            free(inner);
            pieces[count++] = piece;
            start = i + 1;
        }
    }
    // No piece is a prefix of another, so plain descending text order is the best concatenation.
    qsort(pieces, count, sizeof(char*), byDescending);
    char* out = malloc(n + 1);
    int w = 0;
    for (int p = 0; p < count; p++) {
        size_t len = strlen(pieces[p]);
        memcpy(out + w, pieces[p], len);
        w += (int)len;
        free(pieces[p]);
    }
    out[w] = '\0';
    free(pieces);
    return out;
}

char* rearrangeHills(char* s) {
    return solve(s, 0, (int)strlen(s));
}
