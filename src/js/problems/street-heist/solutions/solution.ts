// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0198.House%20Robber/Solution.ts
// O(n) time, O(1) space - best(i) = max(best(i - 1), best(i - 2) + nums[i]).
function rob(nums: number[]): number {
  // Iterative rather than recursive: 10^5 frames would overflow the call stack.
  let prev = 0;
  let cur = 0;
  for (const x of nums) {
    // Either skip this house (keep cur) or take it on top of the best that skips its neighbor.
    [prev, cur] = [cur, Math.max(cur, prev + x)];
  }
  return cur;
}
