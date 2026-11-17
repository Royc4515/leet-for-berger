// O(n) time, O(1) extra space - write pointer for the next non-zero slot, read pointer scans.
function moveZeroes(nums: number[]): number[] {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) nums[write++] = nums[read];
  }
  // Everything from write onward held a value that was already copied forward, or a zero.
  for (; write < nums.length; write++) nums[write] = 0;
  return nums;
}
