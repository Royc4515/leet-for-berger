/**
 * O(mn log mn) time, O(mn) space. Cells are settled from the largest value down, so every
 * strictly larger neighbor is already final. No recursion: a path can be 40,000 cells long.
 * @param {number[][]} matrix
 * @return {number}
 */
function longestIncreasingPath(matrix) {
  const m = matrix.length;
  const n = matrix[0].length;
  const flat = matrix.flat();
  const order = Array.from({ length: m * n }, (_, i) => i).sort((a, b) => flat[b] - flat[a]);
  const best = new Int32Array(m * n);
  let answer = 0;
  for (const c of order) {
    const v = flat[c];
    const j = c % n;
    let len = 1;
    // Neighbors in the flattened grid: up, down, and left or right within the same row.
    if (c >= n && flat[c - n] > v) len = Math.max(len, best[c - n] + 1);
    if (c + n < m * n && flat[c + n] > v) len = Math.max(len, best[c + n] + 1);
    if (j > 0 && flat[c - 1] > v) len = Math.max(len, best[c - 1] + 1);
    if (j < n - 1 && flat[c + 1] > v) len = Math.max(len, best[c + 1] + 1);
    best[c] = len;
    answer = Math.max(answer, len);
  }
  return answer;
}
