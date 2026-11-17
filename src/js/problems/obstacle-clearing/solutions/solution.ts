// O(rows * cols) - 0-1 BFS. Entering an empty cell costs 0 and an obstacle costs 1, so a deque
// kept in order of cost replaces Dijkstra's heap: 0-cost moves go to the front.
function minimumObstacles(grid: number[][]): number {
  const m = grid.length;
  const n = grid[0].length;
  const total = m * n;
  const dist = new Int32Array(total).fill(total);
  dist[0] = 0;
  // Deque as a ring buffer. A cell is queued only when its cost strictly drops, and the deque
  // only ever holds costs d and d + 1, so that happens at most twice: 4 * cells + 1 slots
  // leave ample room.
  const cap = 4 * total + 1;
  const ring = new Int32Array(cap);
  let head = 0;
  let size = 1;
  const dr = [-1, 1, 0, 0];
  const dc = [0, 0, -1, 1];
  while (size) {
    const cur = ring[head];
    head = (head + 1) % cap;
    size--;
    const r = Math.floor(cur / n);
    const c = cur - r * n;
    for (let k = 0; k < 4; k++) {
      const nr = r + dr[k];
      const nc = c + dc[k];
      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
      const w = grid[nr][nc];
      const next = nr * n + nc;
      // Only a strict improvement is queued, so stale entries cost nothing extra.
      if (dist[cur] + w >= dist[next]) continue;
      dist[next] = dist[cur] + w;
      if (w) {
        ring[(head + size) % cap] = next;
      } else {
        head = (head - 1 + cap) % cap;
        ring[head] = next;
      }
      size++;
    }
  }
  return dist[total - 1];
}
