// O(n) time, O(n) space - one pass, value -> index.
function pairSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let j = 0; j < nums.length; j++) {
    // Look before storing nums[j], so a position is never paired with itself.
    const i = seen.get(target - nums[j]);
    if (i !== undefined) return [i, j];
    seen.set(nums[j], j);
  }
  return [];
}
