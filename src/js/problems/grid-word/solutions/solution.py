# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0079.Word%20Search/Solution.py
from collections import Counter


def exist(board: list[str], word: str) -> bool:
    # O(rows * cols * 3^len) worst case - backtracking, with two prunes that make the
    # pathological boards (one letter everywhere) instant.
    m, n = len(board), len(board[0])
    have = Counter("".join(board))
    need = Counter(word)
    # Not enough copies of some letter: no path can exist, so skip the search entirely.
    if any(have[c] < k for c, k in need.items()):
        return False
    # A path read backwards is still a path. Starting from the rarer end cuts most branches early.
    if have[word[0]] > have[word[-1]]:
        word = word[::-1]
    grid = [list(row) for row in board]

    def dfs(i: int, j: int, k: int) -> bool:
        if grid[i][j] != word[k]:
            return False
        if k == len(word) - 1:
            return True
        c = grid[i][j]
        # A character that never occurs in a word marks the cell as on the current path.
        grid[i][j] = "#"
        for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            x, y = i + a, j + b
            if 0 <= x < m and 0 <= y < n and dfs(x, y, k + 1):
                grid[i][j] = c
                return True
        # Unmark on the way back, or later starting cells would find this cell blocked.
        grid[i][j] = c
        return False

    return any(dfs(i, j, 0) for i in range(m) for j in range(n))
