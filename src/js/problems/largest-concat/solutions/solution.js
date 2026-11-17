/**
 * O(n log n) comparisons - a goes before b exactly when a + b beats b + a as a string.
 * @param {number[]} nums
 * @return {string}
 */
function largestNumber(nums) {
  const parts = nums.map(String);
  parts.sort((a, b) => {
    // a + b and b + a have the same length, so string order is numeric order.
    const ab = a + b;
    const ba = b + a;
    return ab > ba ? -1 : ab < ba ? 1 : 0;
  });
  // The largest value leads; if it is 0, every value is 0 and the answer is a single "0".
  return parts[0] === '0' ? '0' : parts.join('');
}
