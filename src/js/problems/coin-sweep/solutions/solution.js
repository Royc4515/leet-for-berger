/**
 * O(n) - peel the tree from the outside. A closed walk over the m nodes that must be visited
 * crosses each of their m - 1 edges twice, so the answer is 2 * (m - 1).
 * @param {number[]} coins
 * @param {number[][]} edges
 * @return {number}
 */
function collectCoins(coins, edges) {
  const n = coins.length;
  if (!coins.includes(1)) return 0;
  // For each node: its degree and the xor of its neighbours' numbers. A leaf has one neighbour,
  // so its xor is that neighbour, and no adjacency lists are needed.
  const deg = new Int32Array(n);
  const xr = new Int32Array(n);
  for (const [a, b] of edges) {
    deg[a]++;
    deg[b]++;
    xr[a] ^= b;
    xr[b] ^= a;
  }
  const gone = new Uint8Array(n);
  let alive = n;

  // Pass 1: a leaf without a coin is never worth visiting. Removing one may expose another.
  const queue = new Int32Array(n);
  let tail = 0;
  for (let v = 0; v < n; v++) {
    if (deg[v] === 1 && coins[v] === 0) {
      gone[v] = 1;
      queue[tail++] = v;
    }
  }
  for (let head = 0; head < tail; head++) {
    const v = queue[head];
    alive--;
    const p = xr[v];
    xr[p] ^= v;
    deg[p]--;
    if (deg[p] === 1 && coins[p] === 0 && !gone[p]) {
      gone[p] = 1;
      queue[tail++] = p;
    }
  }

  // Pass 2, twice: a coin within distance 2 of the walk is collected from there, so the two
  // outermost layers of nodes need not be visited, whatever they hold.
  for (let round = 0; round < 2; round++) {
    // Reuses the queue's buffer: pass 1 is over.
    let count = 0;
    for (let v = 0; v < n; v++) if (!gone[v] && deg[v] === 1) queue[count++] = v;
    for (let i = 0; i < count; i++) {
      const v = queue[i];
      gone[v] = 1;
      alive--;
      // If the only neighbour was a leaf too (two nodes left), it is already gone.
      if (deg[v] === 1) {
        const p = xr[v];
        xr[p] ^= v;
        deg[p]--;
      }
    }
  }
  return Math.max(0, 2 * (alive - 1));
}
