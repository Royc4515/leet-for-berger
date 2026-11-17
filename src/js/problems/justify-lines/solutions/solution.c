// O(total output) - greedy packing, then spacing rules per line. Every line is exactly maxWidth
// characters, so each output string is one malloc of maxWidth + 1 filled with spaces first.
char** justifyText(char** words, int wordsSize, int maxWidth, int* returnSize) {
    // At most one line per word.
    char** ans = malloc(sizeof(char*) * wordsSize);
    int* len = malloc(sizeof(int) * wordsSize);
    for (int k = 0; k < wordsSize; k++) len[k] = (int)strlen(words[k]);
    *returnSize = 0;
    for (int i = 0; i < wordsSize;) {
        // Words i..j-1 go on this line; cnt is its width with single gaps.
        int j = i + 1, cnt = len[i];
        while (j < wordsSize && cnt + 1 + len[j] <= maxWidth) cnt += 1 + len[j++];
        char* row = malloc(maxWidth + 1);
        memset(row, ' ', maxWidth);
        row[maxWidth] = 0;
        int gaps = j - i - 1, pos = 0;
        if (j == wordsSize || gaps == 0) {
            // The last line and one-word lines are left-aligned; the padding is already there.
            for (int k = i; k < j; k++) {
                memcpy(row + pos, words[k], len[k]);
                pos += len[k] + 1;
            }
        } else {
            int spaceWidth = maxWidth - (cnt - gaps);
            // Leftmost gaps take the remainder, one extra space each.
            int w = spaceWidth / gaps, m = spaceWidth % gaps;
            for (int k = i; k < j; k++) {
                memcpy(row + pos, words[k], len[k]);
                pos += len[k] + w + (k - i < m ? 1 : 0);
            }
        }
        ans[(*returnSize)++] = row;
        i = j;
    }
    free(len);
    return ans;
}
