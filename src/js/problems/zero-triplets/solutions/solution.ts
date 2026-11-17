// O(n^2) time - sort, fix the smallest value, then two pointers on the rest.
function threeSum(nums: number[]): number[][] {
  // The default sort compares as strings, so a numeric comparator is required.
  const a = [...nums].sort((x, y) => x - y);
  const out: number[][] = [];
  for (let i = 0; i < a.length - 2; i++) {
    // Sorted: once the smallest value is positive, no triplet can reach zero.
    if (a[i] > 0) break;
    // Equal neighbours would produce the same triplets again.
    if (i > 0 && a[i] === a[i - 1]) continue;
    let lo = i + 1;
    let hi = a.length - 1;
    while (lo < hi) {
      const sum = a[i] + a[lo] + a[hi];
      if (sum < 0) lo++;
      else if (sum > 0) hi--;
      else {
        out.push([a[i], a[lo], a[hi]]);
        lo++;
        hi--;
        // Step past repeats of the pair just used, so it is reported once.
        while (lo < hi && a[lo] === a[lo - 1]) lo++;
        while (lo < hi && a[hi] === a[hi + 1]) hi--;
      }
    }
  }
  return out;
}
