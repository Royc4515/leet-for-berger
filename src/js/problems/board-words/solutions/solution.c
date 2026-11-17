// One trie for all words, one backtracking search from each cell that follows the trie, so words
// sharing a beginning share the walk. Found words leave the trie and emptied branches are cut,
// so finished parts of the trie are never walked again.
// Trie nodes live in one array and refer to children by index; 0 means "no child", since node 0
// is the root and never anyone's child.
typedef struct {
    int next[26];
    int kids;
    int ref; // index of the word ending here, or -1
} WordNode;

static WordNode* nodes;
static char grid[12][13];
static int rows, cols;
static char** wordList;
static char** found;
static int foundCount;

static void dfs(int parent, int i, int j) {
    static const int dirs[5] = {-1, 0, 1, 0, -1};
    int idx = grid[i][j] - 'a';
    int node = nodes[parent].next[idx];
    if (nodes[node].ref != -1) {
        // Clearing the mark reports each word once, however many paths spell it.
        found[foundCount++] = wordList[nodes[node].ref];
        nodes[node].ref = -1;
    }
    char c = grid[i][j];
    // '#' is not a letter, so the cell cannot be reused further down this path.
    grid[i][j] = '#';
    for (int k = 0; k < 4; k++) {
        int x = i + dirs[k], y = j + dirs[k + 1];
        if (x >= 0 && x < rows && y >= 0 && y < cols && grid[x][y] != '#' && nodes[node].next[grid[x][y] - 'a']) {
            dfs(node, x, y);
        }
    }
    grid[i][j] = c;
    if (nodes[node].kids == 0 && nodes[node].ref == -1) {
        nodes[parent].next[idx] = 0;
        nodes[parent].kids--;
    }
}

static int compareWords(const void* a, const void* b) {
    return strcmp(*(char* const*)a, *(char* const*)b);
}

/**
 * Note: the returned array is malloced and the caller frees it. Its strings point into `words`,
 * which the caller already owns.
 */
char** findWords(char** board, int boardSize, char** words, int wordsSize, int* returnSize) {
    rows = boardSize;
    cols = strlen(board[0]);
    for (int i = 0; i < rows; i++) memcpy(grid[i], board[i], cols);
    int total = 1;
    for (int w = 0; w < wordsSize; w++) total += strlen(words[w]);
    // At most one node per letter of input, plus the root.
    nodes = calloc(total, sizeof(WordNode));
    int count = 1;
    nodes[0].ref = -1;
    for (int w = 0; w < wordsSize; w++) {
        int node = 0;
        for (const char* p = words[w]; *p; p++) {
            int c = *p - 'a';
            if (!nodes[node].next[c]) {
                nodes[count].ref = -1;
                nodes[node].next[c] = count++;
                nodes[node].kids++;
            }
            node = nodes[node].next[c];
        }
        nodes[node].ref = w;
    }
    wordList = words;
    found = malloc(sizeof(char*) * (wordsSize ? wordsSize : 1));
    foundCount = 0;
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (nodes[0].next[grid[i][j] - 'a']) dfs(0, i, j);
        }
    }
    free(nodes);
    qsort(found, foundCount, sizeof(char*), compareWords);
    *returnSize = foundCount;
    return found;
}
