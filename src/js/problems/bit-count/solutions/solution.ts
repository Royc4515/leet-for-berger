// O(number of 1 bits) - n & (n - 1) clears the lowest set bit, so the loop runs once per 1
// instead of once per bit position.
function hammingWeight(n: number): number {
  // JS bitwise operators work on 32 bits; `>>> 0` keeps values from 2^31 up as the same bits.
  // After that the signed view is fine: x & (x - 1) still reaches 0 after popcount steps.
  let x = n >>> 0;
  let count = 0;
  while (x !== 0) {
    x &= x - 1;
    count++;
  }
  return count;
}
