// O(32) - XOR adds without carrying, AND << 1 is the carry; repeat until no carry is left.
// JS bitwise operators already work on 32-bit two's complement, so the carry falls off the top.
function getSum(a: number, b: number): number {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a ^= b;
    b = carry;
  }
  return a;
}
