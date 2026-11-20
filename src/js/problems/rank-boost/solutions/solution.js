/**
 * O(n log n) time, O(n) space. Sorted, the cheapest win for the smallest unbeaten value is the
 * next larger one, so one forward pointer finds every match.
 * @param {number[]} nums
 * @return {number}
 */
function rankBoost(nums) {
  // The comparator is required: the default sort compares numbers as strings.
  const s = [...nums].sort((a, b) => a - b);
  let j = 0;
  // j never passes the current index, so s[j] is always a value already seen or equal to x.
  for (const x of s) if (x > s[j]) j++;
  return j;
}
