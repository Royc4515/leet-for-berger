// O(1) per call, O(n) memory: signed counters per row, column and diagonal (+1 for player 1,
// -1 for player 2). A line is complete for one player exactly when its counter is +-n.
typedef struct {
    int n;
    int* rows;
    int* cols;
    int diag;
    int anti;
} GridDuel;

GridDuel* gridDuelCreate(int n) {
    GridDuel* obj = malloc(sizeof(GridDuel));
    obj->n = n;
    obj->rows = calloc(n, sizeof(int));
    obj->cols = calloc(n, sizeof(int));
    obj->diag = 0;
    obj->anti = 0;
    return obj;
}

int gridDuelPlay(GridDuel* obj, int row, int col, int player) {
    int d = player == 1 ? 1 : -1;
    int n = obj->n;
    obj->rows[row] += d;
    obj->cols[col] += d;
    // The diagonals only count the cells that lie on them.
    if (row == col) obj->diag += d;
    if (row + col == n - 1) obj->anti += d;
    if (abs(obj->rows[row]) == n || abs(obj->cols[col]) == n || abs(obj->diag) == n || abs(obj->anti) == n) return player;
    return 0;
}

void gridDuelFree(GridDuel* obj) {
    free(obj->rows);
    free(obj->cols);
    free(obj);
}
