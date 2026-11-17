/**
 * O(n) time - each run is walked once, from its first number only.
 * @param {number[]} nums
 * @return {number}
 */
function longestStreak(nums) {
  const values = new Set(nums);
  let best = 0;
  for (const x of values) {
    if (values.has(x - 1)) continue; // not a run start: counted from its first number
    let length = 1;
    while (values.has(x + length)) length++;
    best = Math.max(best, length);
  }
  return best;
}
