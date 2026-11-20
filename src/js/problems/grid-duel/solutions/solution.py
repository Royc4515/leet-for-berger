class GridDuel:
    # O(1) per call, O(n) memory: signed counters per row, column and diagonal (+1 for player 1,
    # -1 for player 2). A line is complete for one player exactly when its counter is +-n.

    def __init__(self, n: int):
        self.n = n
        self.rows = [0] * n
        self.cols = [0] * n
        self.diag = 0
        self.anti = 0

    def play(self, row: int, col: int, player: int) -> int:
        d = 1 if player == 1 else -1
        self.rows[row] += d
        self.cols[col] += d
        # The diagonals only count the cells that lie on them.
        if row == col:
            self.diag += d
        if row + col == self.n - 1:
            self.anti += d
        n = self.n
        if abs(self.rows[row]) == n or abs(self.cols[col]) == n or abs(self.diag) == n or abs(self.anti) == n:
            return player
        return 0
