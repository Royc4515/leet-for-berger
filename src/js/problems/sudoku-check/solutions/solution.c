// O(81) time, O(1) space - one bitmask per row, column and box; a digit already in any of the
// three groups of the current cell is a repeat.
bool isValidSudoku(char** board, int boardSize) {
    int rows[9] = {0}, cols[9] = {0}, boxes[9] = {0};
    // boardSize is always 9, the loops use the board's fixed shape.
    for (int r = 0; r < 9; r++) {
        for (int c = 0; c < 9; c++) {
            char ch = board[r][c];
            if (ch == '.') continue;
            int bit = 1 << (ch - '1');
            // Integer division gives the band of the row and of the column; together a box id 0-8.
            int b = 3 * (r / 3) + c / 3;
            if ((rows[r] & bit) || (cols[c] & bit) || (boxes[b] & bit)) return false;
            rows[r] |= bit;
            cols[c] |= bit;
            boxes[b] |= bit;
        }
    }
    return true;
}
