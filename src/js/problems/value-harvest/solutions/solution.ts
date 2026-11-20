// O(n + max(nums)) - taking a value takes all its copies, so each value is worth v * count[v],
// and it conflicts only with v - 1 and v + 1: house robber on the value line.
function maxPoints(nums: number[]): number {
  let max = 0;
  for (let i = 0; i < nums.length; i++) if (nums[i] > max) max = nums[i];
  const total = new Float64Array(max + 1);
  for (let i = 0; i < nums.length; i++) total[nums[i]] += nums[i];
  let skip = 0; // best score using values up to v - 2
  let best = 0; // best score using values up to v - 1
  for (let v = 1; v <= max; v++) {
    // Absent values have total 0, so a gap in the values lets both neighbours be taken.
    const take = skip + total[v];
    skip = best;
    if (take > best) best = take;
  }
  return best;
}
