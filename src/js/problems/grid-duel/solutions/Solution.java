// O(1) per call, O(n) memory: signed counters per row, column and diagonal (+1 for player 1,
// -1 for player 2). A line is complete for one player exactly when its counter is +-n.
class GridDuel {
    private final int n;
    private final int[] rows;
    private final int[] cols;
    private int diag;
    private int anti;

    public GridDuel(int n) {
        this.n = n;
        this.rows = new int[n];
        this.cols = new int[n];
    }

    public int play(int row, int col, int player) {
        int d = player == 1 ? 1 : -1;
        rows[row] += d;
        cols[col] += d;
        // The diagonals only count the cells that lie on them.
        if (row == col) diag += d;
        if (row + col == n - 1) anti += d;
        if (Math.abs(rows[row]) == n || Math.abs(cols[col]) == n || Math.abs(diag) == n || Math.abs(anti) == n) return player;
        return 0;
    }
}
