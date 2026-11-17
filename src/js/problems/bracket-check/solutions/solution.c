// O(n) time - the most recently opened bracket must close first, so keep openers on a stack.
bool isValid(char* s) {
    size_t n = strlen(s);
    char* stack = malloc(n + 1);
    size_t top = 0;
    bool ok = true;
    for (size_t i = 0; i < n && ok; i++) {
        char ch = s[i];
        if (ch == '(' || ch == '[' || ch == '{') {
            stack[top++] = ch;
        } else {
            char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';
            // top == 0 means a closer with nothing open.
            ok = top > 0 && stack[--top] == want;
        }
    }
    free(stack);
    // Leftover openers were never closed.
    return ok && top == 0;
}
