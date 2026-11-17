// O(n + 101) time - values are 0..100, so count them instead of comparing pairs.
function smallerNumbersThanCurrent(nums: number[]): number[] {
  const freq = new Array<number>(101).fill(0);
  for (const v of nums) freq[v]++;
  // smaller[v] = how many elements are below v: a running total of the counts before v.
  const smaller = new Array<number>(101).fill(0);
  for (let v = 1; v <= 100; v++) smaller[v] = smaller[v - 1] + freq[v - 1];
  return nums.map((v) => smaller[v]);
}
