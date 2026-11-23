/**
 * O(a + b) time - both lists are sorted by index, so a merge finds the shared indices.
 * @param {number[][]} a
 * @param {number[][]} b
 * @return {number}
 */
function sparseDot(a, b) {
  let i = 0;
  let j = 0;
  let dot = 0;
  while (i < a.length && j < b.length) {
    if (a[i][0] === b[j][0]) {
      dot += a[i][1] * b[j][1];
      i++;
      j++;
    } else if (a[i][0] < b[j][0]) {
      // The smaller index can never meet a partner: every later index in the other list is larger.
      i++;
    } else {
      j++;
    }
  }
  return dot;
}
