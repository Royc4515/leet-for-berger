/**
 * O(n + q log n) time: prefix sums once, then one binary search per draw.
 * @param {number[]} weights
 * @param {number[]} draws
 * @return {number[]}
 */
function weightedDrawLookup(weights, draws) {
  const prefix = new Array(weights.length);
  let total = 0;
  for (let i = 0; i < weights.length; i++) {
    total += weights[i];
    prefix[i] = total;
  }
  return draws.map((d) => {
    let lo = 0;
    let hi = prefix.length - 1;
    // Index i owns [prefix[i - 1], prefix[i]), so the answer is the first prefix strictly above d.
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (prefix[mid] > d) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  });
}
