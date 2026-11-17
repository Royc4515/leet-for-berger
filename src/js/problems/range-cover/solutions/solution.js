/**
 * O(N log N) time - merge every value with its list index, then slide a window over the merged
 * order: grow on the right, shrink from the left while all k lists are still covered.
 * @param {number[][]} nums
 * @return {number[]}
 */
function smallestRange(nums) {
  const k = nums.length;
  const t = [];
  nums.forEach((list, i) => {
    for (const x of list) t.push([x, i]);
  });
  t.sort((p, q) => p[0] - q[0]);
  const have = new Array(k).fill(0);
  let covered = 0;
  let ans = null;
  let j = 0;
  for (const [b, v] of t) {
    if (have[v]++ === 0) covered++;
    while (covered === k) {
      const [a, w] = t[j];
      // Strictly narrower only: b never decreases, so an equally wide window found later starts
      // later, and ties must go to the smaller start.
      if (ans === null || b - a < ans[1] - ans[0]) ans = [a, b];
      if (--have[w] === 0) covered--;
      j++;
    }
  }
  return ans;
}
