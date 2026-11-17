# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0289.Game%20of%20Life/Solution.py
def next_generation(board: list[list[int]]) -> list[list[int]]:
    # O(m * n) time, O(1) extra space - update in place with two transitional states that still
    # remember the current generation: 2 = alive now, dead next; -1 = dead now, alive next.
    # "board[x][y] > 0" is then exactly "alive now", whatever has been rewritten already.
    m, n = len(board), len(board[0])
    for i in range(m):
        for j in range(n):
            # The 3 x 3 scan below counts the cell itself; start at minus its own state.
            live = -board[i][j]
            for x in range(max(0, i - 1), min(m, i + 2)):
                for y in range(max(0, j - 1), min(n, j + 2)):
                    if board[x][y] > 0:
                        live += 1
            if board[i][j] == 1 and (live < 2 or live > 3):
                board[i][j] = 2
            elif board[i][j] == 0 and live == 3:
                board[i][j] = -1
    # Second pass: settle the transitional states into the next generation.
    for row in board:
        for j, v in enumerate(row):
            if v == 2:
                row[j] = 0
            elif v == -1:
                row[j] = 1
    return board
