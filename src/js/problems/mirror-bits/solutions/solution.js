/**
 * O(1): always 32 rounds, so leading zeros of n become trailing zeros of the answer.
 * @param {number} n
 * @return {number}
 */
function mirrorBits(n) {
  let rest = n >>> 0;
  let out = 0;
  for (let i = 0; i < 32; i++) {
    // `* 2` instead of `<< 1`: the shift would turn an answer with its top bit set negative.
    out = out * 2 + (rest & 1);
    rest >>>= 1;
  }
  return out;
}
