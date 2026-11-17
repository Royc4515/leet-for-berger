/**
 * O(k * E) - Bellman-Ford limited to k + 1 rounds: after round j, dist holds the cheapest cost
 * using at most j flights.
 * @param {number} n
 * @param {number[][]} flights
 * @param {number} src
 * @param {number} dst
 * @param {number} k
 * @return {number}
 */
function findCheapestPrice(n, flights, src, dst, k) {
  let dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (let round = 0; round <= k; round++) {
    // Every flight reads the previous round's costs; relaxing in place could chain several
    // flights in one round and break the stop limit.
    const next = [...dist];
    let changed = false;
    for (const [from, to, price] of flights) {
      if (dist[from] + price < next[to]) {
        next[to] = dist[from] + price;
        changed = true;
      }
    }
    dist = next;
    // Nothing improved, so more rounds cannot improve anything either.
    if (!changed) break;
  }
  return dist[dst] === Infinity ? -1 : dist[dst];
}
