/**
 * O(n log n) - sort by end time; best[i] is the top profit using the first i jobs, either
 * skipping job i or taking it on top of the best schedule that ends by its start.
 * @param {number[]} startTime
 * @param {number[]} endTime
 * @param {number[]} profit
 * @return {number}
 */
function maxJobProfit(startTime, endTime, profit) {
  const n = startTime.length;
  // Sort job indexes, not three arrays: the three arrays must stay aligned.
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => endTime[a] - endTime[b]);
  const ends = new Int32Array(n);
  for (let i = 0; i < n; i++) ends[i] = endTime[order[i]];
  const best = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) {
    const job = order[i];
    // Count the jobs with end <= start (`<=`: a job may begin exactly when another ends). They
    // all sort before job i because start < end.
    let lo = 0;
    let hi = i;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ends[mid] <= startTime[job]) lo = mid + 1;
      else hi = mid;
    }
    best[i + 1] = Math.max(best[i], best[lo] + profit[job]);
  }
  return best[n];
}
