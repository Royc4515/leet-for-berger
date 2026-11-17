// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0055.Jump%20Game/Solution.ts
// O(n) time - reachable indices always form a prefix, so its right end says everything.
function canJump(nums: number[]): boolean {
  let reach = 0;
  for (let i = 0; i < nums.length; ++i) {
    // Standing past the farthest reachable index means no path ever got here.
    if (reach < i) return false;
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}
