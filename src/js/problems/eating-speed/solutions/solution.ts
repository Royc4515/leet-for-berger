// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0875.Koko%20Eating%20Bananas/Solution.ts
// O(n log(max pile)) time - hours only fall as speed rises, so binary search the speed.
function minEatingSpeed(piles: number[], h: number): number {
  // Speed max(piles) finishes every pile in one hour, and h >= piles.length, so it always works.
  // A loop instead of Math.max(...piles): spreading 10^4 arguments risks the call stack limit.
  let l = 1;
  let r = 1;
  for (const x of piles) if (x > r) r = x;
  while (l < r) {
    const mid = Math.floor((l + r) / 2);
    // Doubles are exact here: the total stays below 2^53.
    let s = 0;
    for (const x of piles) s += Math.ceil(x / mid);
    if (s <= h) r = mid;
    else l = mid + 1;
  }
  return l;
}
