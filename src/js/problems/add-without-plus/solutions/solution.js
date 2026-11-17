/**
 * O(32) - XOR adds without carrying, AND << 1 is the carry; repeat until no carry is left.
 * JS bitwise operators already work on 32-bit two's complement, so the carry falls off the top.
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
function getSum(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a ^= b;
    b = carry;
  }
  return a;
}
