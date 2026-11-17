// O(n) time - a subarray (i, j] sums to k exactly when prefix[j] - prefix[i] === k.
function subarraySum(nums: number[], k: number): number {
  // Seeding prefix 0 once counts subarrays that start at index 0.
  const seen = new Map<number, number>([[0, 1]]);
  let prefix = 0;
  let count = 0;
  for (const v of nums) {
    prefix += v;
    // Look up before inserting, so the empty subarray (i === j) is never counted.
    count += seen.get(prefix - k) ?? 0;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}
