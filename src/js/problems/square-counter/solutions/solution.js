const SIDE = 1001;

// O(1) per add; per count, O(distinct points in the query's column). A corner on the query's
// vertical line fixes the side length d, and the square lies either to the left or to the right,
// so each such corner is checked twice.
class SquareCounter {
  constructor() {
    // Multiplicity of every grid point, flattened: point (x, y) lives at x * SIDE + y.
    this.cnt = new Int32Array(SIDE * SIDE);
    // Distinct y values seen in each column, so count walks only the column it needs.
    this.cols = Array.from({ length: SIDE }, () => []);
  }

  /**
   * @param {number[]} point
   * @return {void}
   */
  add(point) {
    const [x, y] = point;
    const k = x * SIDE + y;
    if (this.cnt[k] === 0) this.cols[x].push(y);
    this.cnt[k]++;
  }

  /**
   * @param {number[]} point
   * @return {number}
   */
  count(point) {
    const [x, y] = point;
    const cnt = this.cnt;
    // Products of three multiplicities reach about 4 * 10^12: past 32 bits, far below 2^53.
    let total = 0;
    for (const y2 of this.cols[x]) {
      const d = y2 - y;
      if (d === 0) continue;
      const here = cnt[x * SIDE + y2];
      for (const x2 of [x - d, x + d]) {
        if (x2 < 0 || x2 >= SIDE) continue;
        // Copies are distinct choices, so the multiplicities multiply.
        total += here * cnt[x2 * SIDE + y] * cnt[x2 * SIDE + y2];
      }
    }
    return total;
  }
}
