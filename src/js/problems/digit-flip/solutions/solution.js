/**
 * O(log x) time: peel the last digit and append it to the result, once per digit.
 * @param {number} x
 * @return {number}
 */
function flipDigits(x) {
  let rest = Math.abs(x);
  let flipped = 0;
  while (rest > 0) {
    flipped = flipped * 10 + (rest % 10);
    rest = Math.floor(rest / 10);
  }
  if (x < 0) flipped = -flipped;
  // Doubles are exact far beyond 10 digits, so one range check at the end is enough.
  if (flipped < -(2 ** 31) || flipped > 2 ** 31 - 1) return 0;
  // `|| 0` turns a negative zero into 0.
  return flipped || 0;
}
