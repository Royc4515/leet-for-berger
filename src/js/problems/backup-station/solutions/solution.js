/**
 * Nearly O(c + links + queries) - union-find once, then one forward-only pointer per grid.
 * @param {number} c
 * @param {number[][]} links
 * @param {number[][]} queries
 * @return {number[]}
 */
function backupStations(c, links, queries) {
  const parent = new Int32Array(c);
  for (let i = 0; i < c; i++) parent[i] = i;
  // Path halving keeps the trees flat without recursion (a 10^5 line would be too deep).
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (let i = 0; i < links.length; i++) parent[find(links[i][0] - 1)] = find(links[i][1] - 1);

  // The stations of the grid with root r sit in order[start[r] .. start[r + 1]), increasing:
  // visiting ids ascending while filling keeps each group sorted.
  const root = new Int32Array(c);
  const start = new Int32Array(c + 1);
  for (let i = 0; i < c; i++) {
    root[i] = find(i);
    start[root[i] + 1]++;
  }
  for (let i = 0; i < c; i++) start[i + 1] += start[i];
  const fill = start.slice(0, c);
  const order = new Int32Array(c);
  for (let i = 0; i < c; i++) order[fill[root[i]]++] = i;
  const ptr = start.slice(0, c);
  const online = new Uint8Array(c).fill(1);

  const answers = [];
  for (let i = 0; i < queries.length; i++) {
    const kind = queries[i][0];
    const x0 = queries[i][1];
    const x = x0 - 1;
    if (kind === 2) {
      online[x] = 0;
    } else if (online[x]) {
      answers.push(x0);
    } else {
      const r = root[x];
      // A station never comes back online, so the pointer only moves forward: every station
      // is skipped at most once over the whole run.
      while (ptr[r] < start[r + 1] && !online[order[ptr[r]]]) ptr[r]++;
      answers.push(ptr[r] < start[r + 1] ? order[ptr[r]] + 1 : -1);
    }
  }
  return answers;
}
