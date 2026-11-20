// O(1) per call, O(n) memory: signed counters per row, column and diagonal (+1 for player 1,
// -1 for player 2). A line is complete for one player exactly when its counter is +-n.
class GridDuel {
private:
    int n;
    vector<int> rows;
    vector<int> cols;
    int diag = 0;
    int anti = 0;

public:
    GridDuel(int n)
        : n(n)
        , rows(n, 0)
        , cols(n, 0) {}

    int play(int row, int col, int player) {
        int d = player == 1 ? 1 : -1;
        rows[row] += d;
        cols[col] += d;
        // The diagonals only count the cells that lie on them.
        if (row == col) diag += d;
        if (row + col == n - 1) anti += d;
        if (abs(rows[row]) == n || abs(cols[col]) == n || abs(diag) == n || abs(anti) == n) return player;
        return 0;
    }
};
