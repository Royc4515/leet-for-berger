// O(m * n) time - four walls close in; each sweep reads one side of the current layer.
function spiralOrder(matrix: number[][]): number[] {
  const out: number[] = [];
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    for (let r = top + 1; r <= bottom; r++) out.push(matrix[r][right]);
    // A lone leftover row or column was already read by the two sweeps above.
    if (top < bottom && left < right) {
      for (let c = right - 1; c >= left; c--) out.push(matrix[bottom][c]);
      for (let r = bottom - 1; r > top; r--) out.push(matrix[r][left]);
    }
    top++;
    bottom--;
    left++;
    right--;
  }
  return out;
}
