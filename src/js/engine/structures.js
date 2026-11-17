/**
 * Helpers for problem authors: the JSON forms of trees and their node objects.
 *
 * Test cases store a binary tree as level order with nulls and no trailing nulls
 * ([3,9,20,null,null,15,7]); a linked list is just an array. Reference solutions and test
 * generators use these helpers so they agree with the adapters (engine/adapters.js) and the
 * verifier harnesses, which use the same convention. Pure module.
 */

/**
 * @typedef {{ val: number, left: TreeNode|null, right: TreeNode|null }} TreeNode
 */

/**
 * Level-order array (with nulls) to tree nodes.
 * @param {(number|null)[]} level
 * @returns {TreeNode|null}
 */
export function treeFromLevel(level) {
  if (!level.length || level[0] === null) return null;
  const root = { val: level[0], left: null, right: null };
  const queue = [root];
  let i = 1;
  for (let h = 0; h < queue.length && i < level.length; h++) {
    const node = queue[h];
    for (const side of ['left', 'right']) {
      if (i < level.length && level[i] !== null) {
        node[side] = { val: level[i], left: null, right: null };
        queue.push(node[side]);
      }
      i++;
    }
  }
  return root;
}

/**
 * Tree nodes to the canonical level-order array (trailing nulls trimmed).
 * @param {TreeNode|null} root
 * @returns {(number|null)[]}
 */
export function levelFromTree(root) {
  if (!root) return [];
  const out = [];
  const queue = [root];
  for (let h = 0; h < queue.length; h++) {
    const node = queue[h];
    if (!node) {
      out.push(null);
      continue;
    }
    out.push(node.val);
    queue.push(node.left, node.right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

/**
 * Builds a random binary search tree from distinct values (insertion order = values order), so
 * depth stays logarithmic in expectation. Deterministic for a given input array.
 * @param {number[]} values
 * @returns {TreeNode|null}
 */
export function bstFromInsertions(values) {
  let root = null;
  for (const v of values) {
    const node = { val: v, left: null, right: null };
    if (!root) {
      root = node;
      continue;
    }
    let cur = root;
    for (;;) {
      const side = v < cur.val ? 'left' : 'right';
      if (!cur[side]) {
        cur[side] = node;
        break;
      }
      cur = cur[side];
    }
  }
  return root;
}

/**
 * Validates a level-order tree array: values integers, structure consistent (no child under a null).
 * @param {unknown} level
 * @returns {string|null} error, or null when valid
 */
export function checkLevelArray(level) {
  if (!Array.isArray(level)) return 'must be an array';
  if (level.length && level[0] === null) return 'root cannot be null in a non-empty tree';
  if (!level.every((x) => x === null || Number.isInteger(x))) return 'values must be integers or null';
  // A canonical array never ends with null and every non-null slot has a parent slot.
  if (level.length && level[level.length - 1] === null) return 'trailing nulls are not allowed';
  const rebuilt = levelFromTree(treeFromLevel(level));
  if (rebuilt.length !== level.length) return 'a child sits under a missing node';
  return null;
}

/**
 * @typedef {{ val: number, next: ListNode|null }} ListNode
 * @typedef {{ val: number, next: RandomListNode|null, random: RandomListNode|null }} RandomListNode
 */

/**
 * Builds the input of a ListNode@cycle parameter: a list whose tail links back to index pos.
 * @param {number[]} values head to tail
 * @param {number} pos index the tail's next points to, -1 for no cycle
 * @returns {ListNode|null}
 */
export function cycleListFrom(values, pos) {
  const nodes = values.map((val) => ({ val, next: null }));
  nodes.forEach((n, i) => (n.next = nodes[i + 1] ?? null));
  if (pos >= 0 && nodes.length) nodes[nodes.length - 1].next = nodes[pos];
  return nodes[0] ?? null;
}

/**
 * Validates the JSON form [values, pos] of a ListNode@cycle parameter.
 * @param {unknown} arg
 * @returns {string|null} error, or null when valid
 */
export function checkCycleArg(arg) {
  if (!Array.isArray(arg) || arg.length !== 2 || !Array.isArray(arg[0])) return 'must be [values, pos]';
  const [values, pos] = arg;
  if (!values.every(Number.isInteger)) return 'values must be integers';
  if (!Number.isInteger(pos) || pos < -1 || pos >= values.length) return 'pos must be -1 or an index of the list';
  return null;
}

/**
 * Builds a RandomListNode list from its JSON form [[val, randomIndex|null], ...].
 * @param {[number, number|null][]} pairs
 * @returns {{ head: RandomListNode|null, nodes: RandomListNode[] }}
 */
export function randomListFrom(pairs) {
  const nodes = pairs.map(([val]) => ({ val, next: null, random: null }));
  nodes.forEach((n, i) => {
    n.next = nodes[i + 1] ?? null;
    n.random = pairs[i][1] === null ? null : nodes[pairs[i][1]];
  });
  return { head: nodes[0] ?? null, nodes };
}

/**
 * Serializes a RandomListNode list to [[val, randomIndex|null], ...]. A random pointer that leaves
 * the list has no index, so it throws instead of guessing.
 * @param {RandomListNode|null} head
 * @returns {[number, number|null][]}
 */
export function randomListToPairs(head) {
  const index = new Map();
  const order = [];
  for (let n = head; n; n = n.next) {
    if (index.has(n)) throw new Error('list has a cycle');
    index.set(n, order.length);
    order.push(n);
  }
  return order.map((n) => {
    if (n.random !== null && !index.has(n.random)) throw new Error('random points outside the list');
    return [n.val, n.random === null ? null : index.get(n.random)];
  });
}

/**
 * Validates the JSON form of a RandomListNode list.
 * @param {unknown} pairs
 * @returns {string|null} error, or null when valid
 */
export function checkRandomPairs(pairs) {
  if (!Array.isArray(pairs)) return 'must be an array of [val, randomIndex] pairs';
  for (const p of pairs) {
    if (!Array.isArray(p) || p.length !== 2 || !Number.isInteger(p[0])) return 'each node must be [val, randomIndex]';
    if (p[1] !== null && (!Number.isInteger(p[1]) || p[1] < 0 || p[1] >= pairs.length)) return 'randomIndex must be null or an index of the list';
  }
  return null;
}

/**
 * Validates the JSON form of a NestedInteger[] parameter: nested arrays whose leaves are integers.
 * @param {unknown} list
 * @param {number} [maxDepth] deepest allowed list nesting (the outer list is depth 1)
 * @returns {string|null} error, or null when valid
 */
export function checkNestedList(list, maxDepth = 100) {
  if (!Array.isArray(list)) return 'must be an array';
  // Iterative so a hostile custom input cannot overflow the call stack while being checked.
  const stack = [[list, 1]];
  while (stack.length) {
    const [cur, depth] = stack.pop();
    if (depth > maxDepth) return `nesting deeper than ${maxDepth}`;
    for (const x of cur) {
      if (Array.isArray(x)) stack.push([x, depth + 1]);
      else if (!Number.isInteger(x)) return 'items must be integers or lists';
    }
  }
  return null;
}
