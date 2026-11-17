// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0014.Longest%20Common%20Prefix/Solution.c
// O(total length) - vertical scan: column i of every word, stopping at the first mismatch.
char* longestCommonPrefix(char** strs, int strsSize) {
    int i = 0;
    for (; strs[0][i]; i++) {
        int j = 1;
        // A shorter word ends with '\0', which never equals a letter, so no length check is needed.
        while (j < strsSize && strs[j][i] == strs[0][i]) j++;
        if (j < strsSize) break;
    }
    // Copy instead of cutting strs[0] in place: the caller still owns the input.
    char* out = malloc(i + 1);
    memcpy(out, strs[0], i);
    out[i] = '\0';
    return out;
}
