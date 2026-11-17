// O(rows * cols * 3^len) worst case - backtracking, with two prunes that make the pathological
// boards (one letter everywhere) instant.
static char grid[6][7];
static char target[16];
static int rowsN, colsN, wordLen;

static bool dfs(int i, int j, int k) {
    if (grid[i][j] != target[k]) return false;
    if (k == wordLen - 1) return true;
    char c = grid[i][j];
    // A character that never occurs in a word marks the cell as on the current path.
    grid[i][j] = '#';
    static const int dirs[5] = {-1, 0, 1, 0, -1};
    bool found = false;
    for (int u = 0; u < 4 && !found; u++) {
        int x = i + dirs[u], y = j + dirs[u + 1];
        found = x >= 0 && x < rowsN && y >= 0 && y < colsN && dfs(x, y, k + 1);
    }
    // Unmark on the way back, or later starting cells would find this cell blocked.
    grid[i][j] = c;
    return found;
}

bool exist(char** board, int boardSize, char* word) {
    rowsN = boardSize;
    colsN = strlen(board[0]);
    wordLen = strlen(word);
    // A path never repeats a cell, so a word longer than the board cannot fit.
    if (wordLen > rowsN * colsN) return false;
    int have[128] = {0}, need[128] = {0};
    for (int i = 0; i < rowsN; i++) {
        for (int j = 0; j < colsN; j++) {
            grid[i][j] = board[i][j];
            have[(int)board[i][j]]++;
        }
    }
    for (int k = 0; k < wordLen; k++) need[(int)word[k]]++;
    // Not enough copies of some letter: no path can exist, so skip the search entirely.
    for (int c = 0; c < 128; c++) if (need[c] > have[c]) return false;
    // A path read backwards is still a path. Starting from the rarer end cuts most branches early.
    bool flip = have[(int)word[0]] > have[(int)word[wordLen - 1]];
    for (int k = 0; k < wordLen; k++) target[k] = flip ? word[wordLen - 1 - k] : word[k];
    for (int i = 0; i < rowsN; i++) {
        for (int j = 0; j < colsN; j++) {
            if (dfs(i, j, 0)) return true;
        }
    }
    return false;
}
