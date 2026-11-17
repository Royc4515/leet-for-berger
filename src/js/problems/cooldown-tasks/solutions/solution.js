/**
 * O(len) time - only the counts matter. The most frequent kind (count x) needs x - 1 frames of
 * n + 1 slots, then one final slot for each kind that ties for x.
 * @param {string} tasks
 * @param {number} n
 * @return {number}
 */
function leastInterval(tasks, n) {
  const cnt = new Array(26).fill(0);
  let x = 0;
  for (let i = 0; i < tasks.length; i++) {
    const c = tasks.charCodeAt(i) - 65;
    cnt[c]++;
    x = Math.max(x, cnt[c]);
  }
  const s = cnt.filter((v) => v === x).length;
  // When the other kinds overflow the frames no slot is idle, so the length is the answer.
  return Math.max(tasks.length, (x - 1) * (n + 1) + s);
}
