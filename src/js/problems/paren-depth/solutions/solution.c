// O(n) time, O(1) space: the counter is the number of brackets open right now.
int maxParenDepth(char* s) {
    int depth = 0, best = 0;
    for (; *s; s++) {
        if (*s == '(') {
            depth++;
            // A new peak can only appear right after an opening bracket.
            if (depth > best) best = depth;
        } else if (*s == ')') {
            depth--;
        }
    }
    return best;
}
