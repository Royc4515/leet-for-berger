// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0074.Search%20a%202D%20Matrix/Solution.ts
// O(log(m * n)) time - the rows read in order form one sorted list; index i is cell (i / n, i % n).
function searchMatrix(matrix: number[][], target: number): boolean {
  const m = matrix.length;
  const n = matrix[0].length;
  // Find the first position whose value is >= target, then check whether it is the target.
  let left = 0;
  let right = m * n - 1;
  while (left < right) {
    const mid = (left + right) >> 1;
    if (matrix[Math.floor(mid / n)][mid % n] >= target) right = mid;
    else left = mid + 1;
  }
  return matrix[Math.floor(left / n)][left % n] === target;
}
