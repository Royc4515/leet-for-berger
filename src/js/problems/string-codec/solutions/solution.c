// O(total length) per call. Length framing: the decoder reads a number, then copies exactly that
// many characters, so no character inside a string ever needs escaping.
typedef struct {
    int unused; // C needs at least one member; the codec itself keeps no state.
} Codec;

Codec* codecCreate() {
    return calloc(1, sizeof(Codec));
}

char* codecEncode(Codec* obj, char** strs, int strsSize) {
    // Measure first so the result is one allocation: each item is up to 10 digits, '#', text.
    size_t total = 1;
    for (int i = 0; i < strsSize; i++) total += strlen(strs[i]) + 11;
    char* out = malloc(total);
    size_t pos = 0;
    for (int i = 0; i < strsSize; i++) {
        size_t len = strlen(strs[i]);
        pos += sprintf(out + pos, "%zu#", len);
        memcpy(out + pos, strs[i], len);
        pos += len;
    }
    out[pos] = 0;
    return out;
}

char** codecDecode(Codec* obj, char* s, int* returnSize) {
    size_t n = strlen(s);
    // Every item takes at least two characters ("0#"), which bounds the count.
    char** out = malloc(sizeof(char*) * (n / 2 + 1));
    *returnSize = 0;
    size_t i = 0;
    while (i < n) {
        // Read the length digit by digit up to the first '#'; the text after it may contain more.
        size_t size = 0;
        while (s[i] != '#') size = size * 10 + (size_t)(s[i++] - '0');
        i++;
        char* item = malloc(size + 1);
        memcpy(item, s + i, size);
        item[size] = 0;
        out[(*returnSize)++] = item;
        i += size;
    }
    return out;
}

void codecFree(Codec* obj) {
    free(obj);
}
