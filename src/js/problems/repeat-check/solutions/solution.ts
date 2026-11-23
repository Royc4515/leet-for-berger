// O(n) average time, O(n) space: track seen values in a Set and stop on the first repeat.
function hasRepeat(nums: number[]): boolean {
  const seen = new Set<number>();
  for (let i = 0; i < nums.length; i++) {
    const v = nums[i];
    if (seen.has(v)) return true;
    seen.add(v);
  }
  return false;
}
