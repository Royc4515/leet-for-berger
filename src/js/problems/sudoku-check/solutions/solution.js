// O(81) time, O(1) space - one bitmask per row, column and box; a digit already in any of the
// three groups of the current cell is a repeat.
function isValidSudoku(board) {
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const ch = board[r][c];
      if (ch === '.') continue;
      const bit = 1 << (Number(ch) - 1);
      // Band of the row and band of the column together name the box; r / 3 + c / 3 would merge boxes.
      const b = 3 * Math.floor(r / 3) + Math.floor(c / 3);
      if (rows[r] & bit || cols[c] & bit || boxes[b] & bit) return false;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
    }
  }
  return true;
}
