// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0752.Open%20the%20Lock/Solution.ts
// O(10^4 * 8) - BFS over the 10^4 codes, stored as integers. One array marks both dead ends
// and visited codes, so every check is O(1) however many dead ends there are.
function openLock(deadends: string[], target: string): number {
  const goal = Number(target);
  if (goal === 0) return 0;
  const blocked = new Uint8Array(10000);
  for (const d of deadends) blocked[Number(d)] = 1;
  if (blocked[0]) return -1;
  blocked[0] = 1;
  let q: number[] = [0];
  let ans = 0;
  while (q.length) {
    ans++;
    const next: number[] = [];
    for (const p of q) {
      for (let place = 1; place < 10000; place *= 10) {
        const digit = Math.floor(p / place) % 10;
        // Turning up from 9 wraps to 0 and down from 0 wraps to 9.
        for (const nd of [(digit + 1) % 10, (digit + 9) % 10]) {
          const t = p + (nd - digit) * place;
          if (t === goal) return ans;
          if (!blocked[t]) {
            blocked[t] = 1;
            next.push(t);
          }
        }
      }
    }
    q = next;
  }
  return -1;
}
