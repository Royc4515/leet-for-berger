// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0034.Find%20First%20and%20Last%20Position%20of%20Element%20in%20Sorted%20Array/Solution.ts
// O(log n) time - two lower bounds: the first index >= target and the first index >= target + 1.
function searchRange(nums: number[], target: number): number[] {
  const search = (x: number): number => {
    let left = 0;
    let right = nums.length;
    while (left < right) {
      const mid = (left + right) >> 1;
      if (nums[mid] >= x) right = mid;
      else left = mid + 1;
    }
    return left;
  };
  const l = search(target);
  const r = search(target + 1);
  // An empty run [l, r) means the target is absent.
  return l === r ? [-1, -1] : [l, r - 1];
}
