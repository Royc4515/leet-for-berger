// O(n) time, O(1) extra space besides the output: left products first, right products second.
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const answer: number[] = new Array(n);
  // answer[i] holds the product of everything left of i; division is out because of zeros.
  let left = 1;
  for (let i = 0; i < n; i++) {
    answer[i] = left;
    left *= nums[i];
  }
  // A single running value is enough for the right side, so no second array is needed.
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    // `|| 0` turns -0 (zero times a negative) into 0, which is what every other language prints.
    answer[i] = answer[i] * right || 0;
    right *= nums[i];
  }
  return answer;
}
