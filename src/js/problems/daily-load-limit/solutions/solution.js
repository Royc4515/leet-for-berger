/**
 * O(n log(sum)) time: if a limit works, every larger limit works, so binary search the smallest
 * limit whose greedy pass needs at most `days` days.
 * @param {number[]} weights
 * @param {number} days
 * @return {number}
 */
function minDailyLimit(weights, days) {
  const fits = (limit) => {
    let used = 1;
    let load = 0;
    for (const w of weights) {
      // A load equal to the limit is allowed, so a new day starts only when it would be passed.
      if (load + w > limit) {
        used++;
        load = 0;
      }
      load += w;
    }
    return used <= days;
  };
  // Every package must fit on a day by itself, and one day carries everything at the total.
  let lo = 0;
  let hi = 0;
  for (const w of weights) {
    if (w > lo) lo = w;
    hi += w;
  }
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (fits(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
