/**
 * Input generators for growth specs (docs/adr/0004-complexity-feedback.md, docs/PROBLEM_FORMAT.md
 * "Growth estimate"): the common input shapes, built in O(n) (or O(n log n) for sorted output)
 * from a seeded generator, so a problem's `growth.input(n, seed)` is a few lines.
 *
 * Every generator takes the size first and `rng` second, where `rng` is `mulberry32(seed)` from
 * engine/rng.js (invariant 5: never Math.random). Options carry the problem's own rules (value
 * range, distinct values, alphabet, height bound); a generator never picks values outside them.
 * The output is the JSON form the judge uses: arrays, level-order trees with nulls, edge lists.
 *
 * Pure module: no DOM, no clock, no I/O.
 */

/**
 * Integer in [lo, hi], both inclusive.
 * @param {() => number} rng
 * @param {number} lo
 * @param {number} hi
 * @returns {number}
 */
export function randInt(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/**
 * Shuffles in place (Fisher-Yates) and returns the array.
 * @template T
 * @param {T[]} arr
 * @param {() => number} rng
 * @returns {T[]}
 */
export function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

/**
 * Sorts numbers ascending through a Float64Array: several times faster than Array#sort with a
 * comparator at 10^6 elements, and `input` runs inside the browser's 5 s growth budget.
 * @param {number[]} arr
 * @returns {number[]} a new sorted array
 */
function sortNumbers(arr) {
  return Array.from(Float64Array.from(arr).sort());
}

/**
 * n integers in [min, max].
 *
 * `distinct` needs max - min + 1 >= n; it draws without replacement (a partial shuffle when the
 * range is small, rejection when it is large), so the cost stays O(n). `sorted` returns them in
 * ascending order (non-decreasing, or strictly increasing with `distinct`).
 * @param {number} n
 * @param {() => number} rng
 * @param {{ min?: number, max?: number, distinct?: boolean, sorted?: boolean }} [opts]
 * @returns {number[]}
 */
export function intArray(n, rng, { min = -1e9, max = 1e9, distinct = false, sorted = false } = {}) {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) throw new Error(`intArray: bad range [${min}, ${max}]`);
  const range = max - min + 1;
  let out;
  if (!distinct) {
    out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = min + Math.floor(rng() * range);
  } else {
    if (range < n) throw new Error(`intArray: ${n} distinct values do not fit in [${min}, ${max}]`);
    if (range <= 4 * n) {
      // Small range: shuffle the first n slots of the range in place.
      const all = Array.from({ length: range }, (_, i) => min + i);
      for (let i = 0; i < n; i++) {
        const j = i + Math.floor(rng() * (range - i));
        const t = all[i];
        all[i] = all[j];
        all[j] = t;
      }
      out = all.slice(0, n);
    } else {
      // Large range: rejection; at most 1 in 4 draws repeats, so the expected cost is O(n).
      const seen = new Set();
      out = [];
      while (out.length < n) {
        const v = min + Math.floor(rng() * range);
        if (!seen.has(v)) {
          seen.add(v);
          out.push(v);
        }
      }
    }
  }
  return sorted ? sortNumbers(out) : out;
}

/**
 * A string of n characters drawn from `alphabet`.
 * @param {number} n
 * @param {() => number} rng
 * @param {{ alphabet?: string }} [opts] default lowercase a-z
 * @returns {string}
 */
export function charString(n, rng, { alphabet = 'abcdefghijklmnopqrstuvwxyz' } = {}) {
  const chars = new Array(n);
  for (let i = 0; i < n; i++) chars[i] = alphabet[Math.floor(rng() * alphabet.length)];
  return chars.join('');
}

/**
 * n strings, each with a length in [minLen, maxLen], over `alphabet`. `distinct` rejects repeats
 * (the caller makes sure enough strings exist).
 * @param {number} n
 * @param {() => number} rng
 * @param {{ minLen?: number, maxLen?: number, alphabet?: string, distinct?: boolean }} [opts]
 * @returns {string[]}
 */
export function stringList(n, rng, { minLen = 1, maxLen = 10, alphabet = 'abcdefghijklmnopqrstuvwxyz', distinct = false } = {}) {
  const out = [];
  const seen = distinct ? new Set() : null;
  let misses = 0;
  while (out.length < n) {
    const s = charString(randInt(rng, minLen, maxLen), rng, { alphabet });
    if (seen) {
      if (seen.has(s)) {
        if (++misses > 10 * n + 100) throw new Error('stringList: not enough distinct strings for these options');
        continue;
      }
      seen.add(s);
    }
    out.push(s);
  }
  return out;
}

/**
 * Rows and columns of a grid with about n cells: square unless `rows` or `cols` is given.
 * @param {number} n
 * @param {{ rows?: number, cols?: number }} [opts]
 * @returns {{ rows: number, cols: number }}
 */
export function gridShape(n, { rows, cols } = {}) {
  if (rows && cols) return { rows, cols };
  if (rows) return { rows, cols: Math.max(1, Math.round(n / rows)) };
  if (cols) return { rows: Math.max(1, Math.round(n / cols)), cols };
  const side = Math.max(1, Math.round(Math.sqrt(n)));
  return { rows: side, cols: side };
}

/**
 * A grid of about n cells (n counts cells, docs/PROBLEM_FORMAT.md). Cells come from `cells`
 * (characters of a string, or any values), each with probability `weights[i]` when given
 * (default uniform). `as: 'strings'` joins each row into a string (Island Count's form);
 * otherwise each row is an array.
 * @param {number} n
 * @param {() => number} rng
 * @param {{ rows?: number, cols?: number, cells?: string | unknown[], weights?: number[], as?: 'strings' | 'arrays' }} [opts]
 * @returns {string[] | unknown[][]}
 */
export function grid(n, rng, { rows, cols, cells = '01', weights, as = 'arrays' } = {}) {
  const shape = gridShape(n, { rows, cols });
  const values = typeof cells === 'string' ? [...cells] : cells;
  let cumulative = null;
  if (weights) {
    if (weights.length !== values.length) throw new Error('grid: one weight per cell value');
    const total = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    cumulative = weights.map((w) => (acc += w / total));
  }
  const draw = () => {
    const r = rng();
    if (!cumulative) return values[Math.floor(r * values.length)];
    for (let i = 0; i < cumulative.length - 1; i++) if (r < cumulative[i]) return values[i];
    return values[values.length - 1];
  };
  const out = [];
  for (let r = 0; r < shape.rows; r++) {
    const row = new Array(shape.cols);
    for (let c = 0; c < shape.cols; c++) row[c] = draw();
    out.push(as === 'strings' ? row.join('') : row);
  }
  return out;
}

/**
 * An integer grid of about n cells, values in [min, max].
 * @param {number} n
 * @param {() => number} rng
 * @param {{ rows?: number, cols?: number, min?: number, max?: number }} [opts]
 * @returns {number[][]}
 */
export function intGrid(n, rng, { rows, cols, min = 0, max = 9 } = {}) {
  const shape = gridShape(n, { rows, cols });
  return Array.from({ length: shape.rows }, () => intArray(shape.cols, rng, { min, max }));
}

/**
 * A binary tree of n nodes in the judge's JSON form: level order with nulls, no trailing nulls.
 *
 * Shapes:
 * - 'complete': every level full except the last (height about log2 n). Cheapest to build.
 * - 'random': each node takes a uniformly random free child slot, the shape of a random binary
 *   search tree (expected height about 4.3 ln n, 60 at 10^6), so recursive solutions stay far
 *   from the stack limit. `maxHeight` (levels, root = 1) caps it: slots below it are never offered.
 *
 * Values are drawn from [min, max]; with `bst: true` they are distinct and assigned in in-order
 * order, so the tree is a valid binary search tree (strictly increasing in-order).
 * @param {number} n
 * @param {() => number} rng
 * @param {{ shape?: 'complete' | 'random', maxHeight?: number, min?: number, max?: number, bst?: boolean }} [opts]
 * @returns {(number|null)[]}
 */
export function levelTree(n, rng, { shape = 'complete', maxHeight = Infinity, min = -1e4, max = 1e4, bst = false } = {}) {
  if (n <= 0) return [];
  if (shape === 'complete' && Math.ceil(Math.log2(n + 1)) > maxHeight) throw new Error(`levelTree: ${n} nodes do not fit in height ${maxHeight}`);
  if (shape !== 'complete' && 2 ** maxHeight - 1 < n) throw new Error(`levelTree: ${n} nodes do not fit in height ${maxHeight}`);
  // Children as index arrays (-1 = none); node 0 is the root.
  const left = new Int32Array(n).fill(-1);
  const right = new Int32Array(n).fill(-1);
  if (shape === 'complete') {
    for (let i = 0; i < n; i++) {
      if (2 * i + 1 < n) left[i] = 2 * i + 1;
      if (2 * i + 2 < n) right[i] = 2 * i + 2;
    }
  } else if (shape === 'random') {
    // Free slots as parallel arrays: parent index, side (0 left, 1 right), depth of the child.
    const slotParent = [0, 0];
    const slotSide = [0, 1];
    const slotDepth = [2, 2];
    for (let k = 1; k < n; k++) {
      // Slots below maxHeight are never added, so any slot drawn is allowed.
      const s = Math.floor(rng() * slotParent.length);
      const parent = slotParent[s];
      const side = slotSide[s];
      const depth = slotDepth[s];
      const last = slotParent.length - 1;
      slotParent[s] = slotParent[last];
      slotSide[s] = slotSide[last];
      slotDepth[s] = slotDepth[last];
      slotParent.pop();
      slotSide.pop();
      slotDepth.pop();
      if (side === 0) left[parent] = k;
      else right[parent] = k;
      if (depth < maxHeight) {
        slotParent.push(k, k);
        slotSide.push(0, 1);
        slotDepth.push(depth + 1, depth + 1);
      }
    }
  } else throw new Error(`levelTree: unknown shape "${shape}"`);

  const val = new Array(n);
  if (bst) {
    const sortedVals = intArray(n, rng, { min, max, distinct: true, sorted: true });
    // Iterative in-order walk: recursion would overflow on tall trees.
    const stack = [];
    let node = 0;
    let next = 0;
    while (stack.length || node !== -1) {
      while (node !== -1) {
        stack.push(node);
        node = left[node];
      }
      node = stack.pop();
      val[node] = sortedVals[next++];
      node = right[node];
    }
  } else {
    for (let i = 0; i < n; i++) val[i] = min + Math.floor(rng() * (max - min + 1));
  }

  const out = [val[0]];
  const queue = [0];
  for (let h = 0; h < queue.length; h++) {
    const i = queue[h];
    for (const c of [left[i], right[i]]) {
      if (c === -1) out.push(null);
      else {
        out.push(val[c]);
        queue.push(c);
      }
    }
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

/**
 * A linked list of n values in the judge's JSON form (an array, head first). Same options as
 * intArray; a separate name so a spec says what the argument is.
 * @param {number} n
 * @param {() => number} rng
 * @param {{ min?: number, max?: number, distinct?: boolean, sorted?: boolean }} [opts]
 * @returns {number[]}
 */
export function linkedList(n, rng, opts = {}) {
  return intArray(n, rng, { min: -1e4, max: 1e4, ...opts });
}

/**
 * n intervals [start, end] with min <= start <= end <= max and end - start in [minLength, maxLength].
 * `sorted` orders them by start; `disjoint` makes them non-overlapping and sorted (it needs
 * room: n * (maxLength + 1) <= max - min + 1 is the safe bound).
 * @param {number} n
 * @param {() => number} rng
 * @param {{ min?: number, max?: number, minLength?: number, maxLength?: number, sorted?: boolean, disjoint?: boolean }} [opts]
 * @returns {number[][]}
 */
export function intervals(n, rng, { min = 0, max = 1e9, minLength = 0, maxLength = 1000, sorted = false, disjoint = false } = {}) {
  if (minLength > maxLength) throw new Error('intervals: minLength > maxLength');
  if (disjoint) {
    const room = max - min + 1;
    if (n * (maxLength + 1) > room) throw new Error('intervals: not enough room for disjoint intervals');
    // Each interval gets an equal stretch of the range and sits inside it.
    const stretch = Math.floor(room / n);
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const len = randInt(rng, minLength, Math.min(maxLength, stretch - 1));
      const lo = min + i * stretch;
      const start = randInt(rng, lo, lo + stretch - 1 - len);
      out[i] = [start, start + len];
    }
    return out;
  }
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const len = randInt(rng, minLength, Math.min(maxLength, max - min));
    const start = randInt(rng, min, max - len);
    out[i] = [start, start + len];
  }
  if (sorted) out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return out;
}

/**
 * An edge list over nodes 0..nodes-1 (or 1..nodes with `oneBased`), no self loops, no duplicate
 * edges (in either direction when undirected).
 *
 * - `connected`: a random spanning tree first (each node in a shuffled order links to an earlier
 *   one), then the extra edges; needs edges >= nodes - 1.
 * - `acyclic` (directed only): every edge goes forward in one random order of the nodes, so the
 *   graph is a DAG with a topological order the generator never reveals.
 * - `weights: [lo, hi]`: a third entry per edge, an integer weight in that range.
 * @param {number} nodes
 * @param {number} edges
 * @param {() => number} rng
 * @param {{ directed?: boolean, acyclic?: boolean, connected?: boolean, weights?: [number, number] | null, oneBased?: boolean }} [opts]
 * @returns {number[][]}
 */
export function edgeList(nodes, edges, rng, { directed = false, acyclic = false, connected = false, weights = null, oneBased = false } = {}) {
  const maxEdges = directed && !acyclic ? nodes * (nodes - 1) : (nodes * (nodes - 1)) / 2;
  if (edges > maxEdges) throw new Error(`edgeList: ${edges} edges do not fit on ${nodes} nodes`);
  if (connected && edges < nodes - 1) throw new Error('edgeList: a connected graph needs at least nodes - 1 edges');
  if (acyclic && !directed) throw new Error('edgeList: acyclic applies to directed graphs');
  // rank[v] = position of v in a random order; acyclic edges go from lower to higher rank.
  const order = shuffle(Array.from({ length: nodes }, (_, i) => i), rng);
  const rank = new Int32Array(nodes);
  order.forEach((v, i) => (rank[v] = i));
  const seen = new Set();
  const out = [];
  const add = (u, v) => {
    if (u === v) return false;
    if (acyclic && rank[u] > rank[v]) [u, v] = [v, u];
    const key = directed ? u * nodes + v : Math.min(u, v) * nodes + Math.max(u, v);
    if (seen.has(key)) return false;
    seen.add(key);
    const e = oneBased ? [u + 1, v + 1] : [u, v];
    if (weights) e.push(randInt(rng, weights[0], weights[1]));
    out.push(e);
    return true;
  };
  if (connected) {
    for (let i = 1; i < nodes; i++) {
      const a = order[i];
      const b = order[Math.floor(rng() * i)];
      // Random direction for a directed spanning tree, unless acyclic fixes it.
      if (rng() < 0.5) add(a, b);
      else add(b, a);
    }
  }
  let misses = 0;
  while (out.length < edges) {
    const u = Math.floor(rng() * nodes);
    const v = Math.floor(rng() * nodes);
    if (!add(u, v) && ++misses > 50 * edges + 1000) throw new Error('edgeList: too dense for rejection sampling');
  }
  // The spanning tree comes first; shuffle so solutions cannot rely on edge order.
  return shuffle(out, rng);
}
