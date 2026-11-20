// O(1) per call, O(n) memory: signed counters per row, column and diagonal (+1 for player 1,
// -1 for player 2). A line is complete for one player exactly when its counter is +-n.
public class GridDuel {
    private readonly int n;
    private readonly int[] rows;
    private readonly int[] cols;
    private int diag;
    private int anti;

    public GridDuel(int n) {
        this.n = n;
        rows = new int[n];
        cols = new int[n];
    }

    public int Play(int row, int col, int player) {
        int d = player == 1 ? 1 : -1;
        rows[row] += d;
        cols[col] += d;
        // The diagonals only count the cells that lie on them.
        if (row == col) diag += d;
        if (row + col == n - 1) anti += d;
        if (Math.Abs(rows[row]) == n || Math.Abs(cols[col]) == n || Math.Abs(diag) == n || Math.Abs(anti) == n) return player;
        return 0;
    }
}
