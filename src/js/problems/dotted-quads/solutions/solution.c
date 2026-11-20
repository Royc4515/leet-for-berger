// O(1) for bounded input: 3 choices for each of 4 parts. Shorter parts are tried first, and a dot
// sorts before any digit, so the answers come out in dictionary order.
typedef struct {
    const char* s;
    int n;
    int starts[4];  // where each chosen part begins
    int lens[4];    // and how long it is
    char** items;
    int size, cap;
} Search;

static void dfs(Search* st, int pos, int count) {
    int left = 4 - count;
    int rest = st->n - pos;
    // Each remaining part takes 1 to 3 digits; anything else is a dead end.
    if (rest < left || rest > left * 3) return;
    if (left == 0) {
        if (st->size == st->cap) {
            st->cap *= 2;
            st->items = realloc(st->items, sizeof(char*) * st->cap);
        }
        // 20 digits at most, plus 3 dots and the terminator.
        char* line = malloc(st->n + 4);
        int w = 0;
        for (int p = 0; p < 4; p++) {
            if (p) line[w++] = '.';
            memcpy(line + w, st->s + st->starts[p], st->lens[p]);
            w += st->lens[p];
        }
        line[w] = '\0';
        st->items[st->size++] = line;
        return;
    }
    int value = 0;
    for (int len = 1; len <= 3 && pos + len <= st->n; len++) {
        value = value * 10 + (st->s[pos + len - 1] - '0');
        // A leading zero is allowed only for the single digit "0".
        if (len > 1 && st->s[pos] == '0') break;
        if (value > 255) break;
        st->starts[count] = pos;
        st->lens[count] = len;
        dfs(st, pos + len, count + 1);
    }
}

char** dottedQuads(char* s, int* returnSize) {
    Search st = {s, (int)strlen(s), {0}, {0}, malloc(sizeof(char*) * 16), 0, 16};
    dfs(&st, 0, 0);
    *returnSize = st.size;
    return st.items;
}
