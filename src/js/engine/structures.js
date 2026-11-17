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
