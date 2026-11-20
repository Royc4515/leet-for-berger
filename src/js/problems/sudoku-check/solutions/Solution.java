class Solution {
    // O(81) time, O(1) space - one bitmask per row, column and box; a digit already in any of the
    // three groups of the current cell is a repeat.
    public boolean isValidSudoku(String[] board) {
        int[] rows = new int[9], cols = new int[9], boxes = new int[9];
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                char ch = board[r].charAt(c);
                if (ch == '.') continue;
                int bit = 1 << (ch - '1');
                // Integer division gives the band of the row and of the column; together a box id 0-8.
                int b = 3 * (r / 3) + c / 3;
                if ((rows[r] & bit) != 0 || (cols[c] & bit) != 0 || (boxes[b] & bit) != 0) return false;
                rows[r] |= bit;
                cols[c] |= bit;
                boxes[b] |= bit;
            }
        }
        return true;
    }
}
