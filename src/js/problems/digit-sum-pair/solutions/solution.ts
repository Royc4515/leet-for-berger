// O(n) time - only the two largest numbers of a digit-sum group can form its best pair, so
// remembering the largest number seen per digit sum (at most 81 sums) is enough.
function maximumSum(nums: number[]): number {
  const largest: number[] = new Array(82).fill(0);
  let best = -1;
  for (const v of nums) {
    let s = 0;
    for (let x = v; x > 0; x = Math.floor(x / 10)) s += x % 10;
    // 0 means "nothing seen yet": every number is at least 1.
    if (largest[s]) best = Math.max(best, largest[s] + v);
    if (v > largest[s]) largest[s] = v;
  }
  return best;
}
