/**
 * O(log n) time - look at the two lowest bits and drop one bit per iteration.
 * @param {number} n
 * @return {number}
 */
function minSteps(n) {
  let steps = 0;
  while (n > 0) {
    if (n & 1) {
      // ...11 is the end of a run of 1s: adding 1 clears the whole run with one carry.
      // ...01 is a lone 1: subtracting 1 is cheaper. n === 3 ties, so the same rule is safe.
      n += (n & 3) === 3 ? 1 : -1;
      steps++;
    }
    n >>= 1;
  }
  return steps;
}
