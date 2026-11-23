// O(n) time, O(1) extra space: exact sum == goal equals atMost(goal) - atMost(goal - 1).
function countBitSubarrays(nums: number[], goal: number): number {
  const atMost = (limit: number): number => {
    if (limit < 0) return 0;
    let left = 0;
    let window = 0;
    let total = 0;
    for (let right = 0; right < nums.length; right++) {
      window += nums[right];
      while (window > limit) {
        window -= nums[left];
        left++;
      }
      total += right - left + 1;
    }
    return total;
  };
  return atMost(goal) - atMost(goal - 1);
}
