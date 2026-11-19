// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0349.Intersection%20of%20Two%20Arrays/Solution.js
/**
 * O(n + m + k log k) time: set lookups replace the O(n * m) nested loop.
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number[]}
 */
var commonValues = function (nums1, nums2) {
  const inFirst = new Set(nums1);
  // A second set keeps each common value once, however often it repeats.
  const common = new Set(nums2.filter((x) => inFirst.has(x)));
  // Without a comparator, sort() compares as text: 100 before 25, -1 before -5.
  return [...common].sort((a, b) => a - b);
};
