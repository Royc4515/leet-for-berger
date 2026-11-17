// O(n) time, O(1) space - track only the sign. Multiplying would overflow to Infinity, and
// Infinity * 0 is NaN.
function productSign(nums: number[]): number {
  let ans = 1;
  for (const v of nums) {
    // A zero decides the answer wherever it appears.
    if (v === 0) return 0;
    if (v < 0) ans = -ans;
  }
  return ans;
}
