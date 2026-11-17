// O(n) time - a deque of indices whose values strictly decrease from front to back.
function maxSlidingWindow(nums: number[], k: number): number[] {
  // A plain array with a head index: Array.shift is O(n) and would make this O(n^2).
  const dq = new Int32Array(nums.length);
  let head = 0;
  let tail = 0;
  const out: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    // A value no larger than the newcomer can never be a maximum again: it leaves first.
    while (tail > head && nums[dq[tail - 1]] <= nums[i]) tail--;
    dq[tail++] = i;
    // The front is the window maximum unless it has slid out on the left.
    if (dq[head] <= i - k) head++;
    if (i >= k - 1) out.push(nums[dq[head]]);
  }
  return out;
}
