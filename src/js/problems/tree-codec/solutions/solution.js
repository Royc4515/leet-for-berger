// Pre-order with "#" for missing children: O(n) per call. The token position is a local, never
// a field, so every deserialize call starts from the beginning.
class Codec {
  /**
   * @param {TreeNode} root
   * @return {string}
   */
  serialize(root) {
    const out = [];
    const walk = (node) => {
      if (!node) {
        out.push('#');
        return;
      }
      out.push(String(node.val));
      walk(node.left);
      walk(node.right);
    };
    walk(root);
    // One join at the end instead of repeated concatenation keeps this linear.
    return out.join(',');
  }

  /**
   * @param {string} data
   * @return {TreeNode}
   */
  deserialize(data) {
    const tokens = data.split(',');
    let pos = 0;
    const build = () => {
      const token = tokens[pos++];
      if (token === '#') return null;
      const node = new TreeNode(Number(token));
      // Pre-order: the whole left subtree comes before the right one.
      node.left = build();
      node.right = build();
      return node;
    };
    return build();
  }
}
