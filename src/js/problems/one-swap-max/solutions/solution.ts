// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0670.Maximum%20Swap/Solution.ts
// O(d) time - improve the leftmost digit that has a larger digit somewhere to its right.
function maximumSwap(num: number): number {
  // Digits least significant first, so list[0] is the ones digit.
  const list: number[] = [];
  while (num !== 0) {
    list.push(num % 10);
    num = Math.floor(num / 10);
  }
  const n = list.length;
  // idx[i] = position of the largest digit in list[0..i]; '>' keeps the lowest position on ties,
  // which is the rightmost copy in the written number.
  const idx: number[] = [];
  for (let i = 0, j = 0; i < n; i++) {
    if (list[i] > list[j]) j = i;
    idx.push(j);
  }
  // Scan from the most significant digit for the first one that can be improved.
  for (let i = n - 1; i >= 0; i--) {
    if (list[idx[i]] !== list[i]) {
      [list[idx[i]], list[i]] = [list[i], list[idx[i]]];
      break;
    }
  }
  let res = 0;
  for (let i = n - 1; i >= 0; i--) res = res * 10 + list[i];
  return res;
}
