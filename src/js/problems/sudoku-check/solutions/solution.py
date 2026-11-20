def is_valid_sudoku(board: list[str]) -> bool:
    # O(81) time, O(1) space - one bitmask per row, column and box; a digit already in any of the
    # three groups of the current cell is a repeat.
    rows, cols, boxes = [0] * 9, [0] * 9, [0] * 9
    for r in range(9):
        for c in range(9):
            ch = board[r][c]
            if ch == '.':
                continue
            bit = 1 << (int(ch) - 1)
            # Integer division gives the band of the row and of the column; together a box id 0-8.
            b = 3 * (r // 3) + c // 3
            if rows[r] & bit or cols[c] & bit or boxes[b] & bit:
                return False
            rows[r] |= bit
            cols[c] |= bit
            boxes[b] |= bit
    return True
