// O(1) per call, O(n) memory: signed counters per row, column and diagonal (+1 for player 1,
// -1 for player 2). A line is complete for one player exactly when its counter is +-n.
class GridDuel {
  /**
   * @param {number} n
   */
  constructor(n) {
    this.n = n;
    this.rows = new Int32Array(n);
    this.cols = new Int32Array(n);
    this.diag = 0;
    this.anti = 0;
  }

  /**
   * @param {number} row
   * @param {number} col
   * @param {number} player
   * @return {number}
   */
  play(row, col, player) {
    const d = player === 1 ? 1 : -1;
    this.rows[row] += d;
    this.cols[col] += d;
    // The diagonals only count the cells that lie on them.
    if (row === col) this.diag += d;
    if (row + col === this.n - 1) this.anti += d;
    const n = this.n;
    if (Math.abs(this.rows[row]) === n || Math.abs(this.cols[col]) === n || Math.abs(this.diag) === n || Math.abs(this.anti) === n) return player;
    return 0;
  }
}
