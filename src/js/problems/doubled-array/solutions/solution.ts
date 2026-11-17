// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1929.Concatenation%20of%20Array/Solution.ts
// O(n) - spreading twice builds a new array of length 2n and leaves nums untouched.
function doubleArray(nums: number[]): number[] {
  return [...nums, ...nums];
}
