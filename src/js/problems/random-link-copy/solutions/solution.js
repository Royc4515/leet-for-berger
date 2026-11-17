/**
 * O(n) time and space. Pass 1 makes a copy of every node; pass 2 wires both pointers through the
 * map, keyed by the original node itself (values can repeat).
 * @param {RandomListNode} head
 * @return {RandomListNode}
 */
function copyRandomList(head) {
  const copyOf = new Map([[null, null]]);
  for (let node = head; node; node = node.next) copyOf.set(node, new RandomListNode(node.val));
  for (let node = head; node; node = node.next) {
    const copy = copyOf.get(node);
    copy.next = copyOf.get(node.next);
    copy.random = copyOf.get(node.random);
  }
  return copyOf.get(head);
}
