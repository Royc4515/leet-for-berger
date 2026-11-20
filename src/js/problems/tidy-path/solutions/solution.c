// O(n) time, O(n) space: a stack of (start, length) pairs holds the directory names read so far,
// so the input string is never copied or modified.
char* tidyPath(char* path) {
    int n = (int)strlen(path);
    int* start = (int*)malloc(sizeof(int) * (n / 2 + 2));
    int* len = (int*)malloc(sizeof(int) * (n / 2 + 2));
    int top = 0;
    int i = 0;
    while (i < n) {
        int j = i;
        while (j < n && path[j] != '/') j++;
        int partLen = j - i;
        // Empty pieces come from repeated slashes and "." stays where it is.
        if (partLen == 0 || (partLen == 1 && path[i] == '.')) {
            // nothing to do
        } else if (partLen == 2 && path[i] == '.' && path[i + 1] == '.') {
            // At the root there is nothing to go up to, so ".." is ignored.
            if (top > 0) top--;
        } else {
            // Only the exact pieces "." and ".." are special: "..." is an ordinary name.
            start[top] = i;
            len[top] = partLen;
            top++;
        }
        i = j + 1;
    }
    char* out = (char*)malloc(n + 2);
    int pos = 0;
    for (int k = 0; k < top; k++) {
        out[pos++] = '/';
        memcpy(out + pos, path + start[k], len[k]);
        pos += len[k];
    }
    if (pos == 0) out[pos++] = '/';
    out[pos] = '\0';
    free(start);
    free(len);
    return out;
}
