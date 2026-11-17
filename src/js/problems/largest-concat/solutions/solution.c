// O(n log n) comparisons - a goes before b exactly when a + b beats b + a as a string.
static int byConcat(const void* x, const void* y) {
    const char* a = *(const char* const*)x;
    const char* b = *(const char* const*)y;
    // a + b and b + a have the same length, so string order is numeric order. Each value has at
    // most 10 digits, so both concatenations fit in small stack buffers.
    char ab[24], ba[24];
    snprintf(ab, sizeof ab, "%s%s", a, b);
    snprintf(ba, sizeof ba, "%s%s", b, a);
    return strcmp(ba, ab);
}

char* largestNumber(int* nums, int numsSize) {
    char** parts = malloc(sizeof(char*) * numsSize);
    size_t total = 0;
    for (int i = 0; i < numsSize; i++) {
        parts[i] = malloc(12);
        snprintf(parts[i], 12, "%d", nums[i]);
        total += strlen(parts[i]);
    }
    qsort(parts, numsSize, sizeof(char*), byConcat);
    char* out = malloc(total + 1);
    // The largest value leads; if it is 0, every value is 0 and the answer is a single "0".
    if (parts[0][0] == '0') {
        strcpy(out, "0");
    } else {
        size_t pos = 0;
        for (int i = 0; i < numsSize; i++) {
            size_t len = strlen(parts[i]);
            memcpy(out + pos, parts[i], len);
            pos += len;
        }
        out[pos] = '\0';
    }
    for (int i = 0; i < numsSize; i++) free(parts[i]);
    free(parts);
    return out;
}
