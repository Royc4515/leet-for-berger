// O(E log E) - Hierholzer's algorithm with an explicit stack (the walk can be 3 * 10^4 tickets
// deep). C has no hash map, but a three-letter code is a number below 26^3, so airports index
// plain arrays directly.
#define CODES (26 * 26 * 26)

static int codeOf(const char* s) {
    return ((s[0] - 'A') * 26 + (s[1] - 'A')) * 26 + (s[2] - 'A');
}

// Tickets sorted by origin, then by destination descending: each origin's tickets form one
// run whose last entry is its smallest unused destination.
static int cmpTicket(const void* a, const void* b) {
    const int* x = a;
    const int* y = b;
    if (x[0] != y[0]) return x[0] < y[0] ? -1 : 1;
    return (x[1] < y[1]) - (x[1] > y[1]);
}

char** findItinerary(char*** tickets, int ticketsSize, int* ticketsColSize, int* returnSize) {
    int* edges = malloc(sizeof(int) * 2 * ticketsSize);
    for (int i = 0; i < ticketsSize; i++) {
        edges[2 * i] = codeOf(tickets[i][0]);
        edges[2 * i + 1] = codeOf(tickets[i][1]);
    }
    qsort(edges, ticketsSize, sizeof(int) * 2, cmpTicket);
    // end[c] is one past the last unused ticket of origin c; start[c] is where its run begins.
    int* start = calloc(CODES, sizeof(int));
    int* end = calloc(CODES, sizeof(int));
    for (int i = ticketsSize - 1; i >= 0; i--) start[edges[2 * i]] = i;
    for (int i = 0; i < ticketsSize; i++) end[edges[2 * i]] = i + 1;
    int* stack = malloc(sizeof(int) * (ticketsSize + 1));
    int* route = malloc(sizeof(int) * (ticketsSize + 1));
    int top = 0, len = 0;
    stack[top++] = codeOf("JFK");
    while (top > 0) {
        int c = stack[top - 1];
        if (end[c] > start[c]) {
            stack[top++] = edges[2 * (--end[c]) + 1];
        } else {
            // No tickets left here, so this airport comes after everything still on the
            // stack: the route is built back to front.
            route[len++] = stack[--top];
        }
    }
    char** ans = malloc(sizeof(char*) * len);
    for (int i = 0; i < len; i++) {
        int c = route[len - 1 - i];
        ans[i] = malloc(4);
        ans[i][0] = (char)('A' + c / 676);
        ans[i][1] = (char)('A' + c / 26 % 26);
        ans[i][2] = (char)('A' + c % 26);
        ans[i][3] = '\0';
    }
    free(edges);
    free(start);
    free(end);
    free(stack);
    free(route);
    *returnSize = len;
    return ans;
}
