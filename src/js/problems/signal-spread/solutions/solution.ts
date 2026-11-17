// O((V + E) log V) - Dijkstra with a binary heap. Delays are never negative, so the node with
// the smallest tentative time can no longer improve once it is popped.
function networkDelayTime(times: number[][], n: number, k: number): number {
  // Adjacency as flat (node, weight) pairs, which avoids an object per link.
  const adj: number[][] = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push(v, w);
  const dist: number[] = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  // Heap entries are packed into parallel arrays of distance and node.
  const hd: number[] = [0];
  const hv: number[] = [k];
  const push = (d: number, v: number): void => {
    let i = hd.length;
    hd.push(d);
    hv.push(v);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (hd[p] <= d) break;
      hd[i] = hd[p];
      hv[i] = hv[p];
      i = p;
    }
    hd[i] = d;
    hv[i] = v;
  };
  const pop = (): void => {
    const d = hd.pop()!;
    const v = hv.pop()!;
    const size = hd.length;
    let i = 0;
    while (true) {
      let c = 2 * i + 1;
      if (c >= size) break;
      if (c + 1 < size && hd[c + 1] < hd[c]) c++;
      if (hd[c] >= d) break;
      hd[i] = hd[c];
      hv[i] = hv[c];
      i = c;
    }
    if (size) {
      hd[i] = d;
      hv[i] = v;
    }
  };
  while (hd.length) {
    const d = hd[0];
    const u = hv[0];
    pop();
    // A stale entry: u was already settled with a smaller time.
    if (d > dist[u]) continue;
    const list = adj[u];
    for (let j = 0; j < list.length; j += 2) {
      const v = list[j];
      const nd = d + list[j + 1];
      if (nd < dist[v]) {
        dist[v] = nd;
        push(nd, v);
      }
    }
  }
  // The last node to hear the signal decides; one that never hears it makes the answer -1.
  let ans = 0;
  for (let v = 1; v <= n; v++) ans = Math.max(ans, dist[v]);
  return ans === Infinity ? -1 : ans;
}
