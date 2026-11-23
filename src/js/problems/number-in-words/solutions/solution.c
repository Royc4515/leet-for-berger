// O(1) time and space: split into at most four base-1000 groups and spell each non-zero chunk.
static void appendWord(char* buf, size_t* len, const char* word) {
    if (*len > 0) buf[(*len)++] = ' ';
    size_t wlen = strlen(word);
    memcpy(buf + *len, word, wlen);
    *len += wlen;
}

static void appendChunk(char* buf, size_t* len, int n) {
    static const char* BELOW_20[] = {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    };
    static const char* TENS[] = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };
    if (n >= 100) {
        appendWord(buf, len, BELOW_20[n / 100]);
        appendWord(buf, len, "Hundred");
        n %= 100;
    }
    if (n >= 20) {
        appendWord(buf, len, TENS[n / 10]);
        n %= 10;
    }
    if (n > 0) appendWord(buf, len, BELOW_20[n]);
}

char* numberToWords(int num) {
    // The longest 32-bit English spelling is under 160 characters.
    char* out = malloc(256);
    if (num == 0) {
        strcpy(out, "Zero");
        return out;
    }
    static const char* SCALES[] = {"", "Thousand", "Million", "Billion"};
    int chunks[4] = {0, 0, 0, 0};
    int count = 0;
    while (num > 0) {
        chunks[count++] = num % 1000;
        num /= 1000;
    }
    size_t len = 0;
    for (int i = count - 1; i >= 0; i--) {
        if (chunks[i] == 0) continue;
        appendChunk(out, &len, chunks[i]);
        if (SCALES[i][0] != '\0') appendWord(out, &len, SCALES[i]);
    }
    out[len] = '\0';
    return out;
}
