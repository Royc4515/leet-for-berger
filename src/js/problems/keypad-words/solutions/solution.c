// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0017.Letter%20Combinations%20of%20a%20Phone%20Number/Solution.c
// O(4^n * n) time - extend every partial string by each letter of the next digit.
static const char* keys[] = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

char** letterCombinations(char* digits, int* returnSize) {
    // Without this check the loop would return {""} for no digits.
    if (!*digits) {
        *returnSize = 0;
        return malloc(sizeof(char*));
    }

    int size = 1;
    char** ans = malloc(sizeof(char*));
    // strdup is POSIX, not C11, so the empty string is allocated by hand.
    ans[0] = calloc(1, 1);

    for (int x = 0; digits[x]; ++x) {
        const char* s = keys[digits[x] - '2'];
        int len = strlen(s);
        char** t = malloc(sizeof(char*) * size * len);
        int tSize = 0;

        // Prefixes outer, letters inner: the result stays in lexicographic order.
        for (int i = 0; i < size; ++i) {
            // Every prefix in this round has length x, so there is no need to measure it.
            for (int j = 0; j < len; ++j) {
                char* tmp = malloc(x + 2);
                memcpy(tmp, ans[i], x);
                tmp[x] = s[j];
                tmp[x + 1] = '\0';
                t[tSize++] = tmp;
            }
            free(ans[i]);
        }
        free(ans);
        ans = t;
        size = tSize;
    }

    *returnSize = size;
    return ans;
}
