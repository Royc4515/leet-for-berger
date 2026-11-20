// O(n) time, O(1) extra space: pivot = rightmost position that can still grow, swap it with the
// rightmost larger value, then reverse the suffix so it is as small as possible.
function nextArrangement(nums: number[]): number[] {
  const n = nums.length;
  let i = n - 2;
  // The suffix after the pivot is non-increasing; strict ">=" keeps equal values from counting as growable.
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;
  if (i >= 0) {
    let j = n - 1;
    while (nums[j] <= nums[i]) j--;
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  // With no pivot (i = -1) this reverses the whole array: the last arrangement wraps to the first.
  for (let l = i + 1, r = n - 1; l < r; l++, r--) [nums[l], nums[r]] = [nums[r], nums[l]];
  return nums;
}
