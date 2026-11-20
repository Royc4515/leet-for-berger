/**
 * O(n) time in one pass, O(1) space: a second pointer trails the first by n nodes.
 * @param {ListNode} head
 * @param {number} n
 * @return {ListNode}
 */
function dropFromTail(head, n) {
  // The placeholder gives the head a predecessor, so dropping the head is not a special case.
  const dummy = new ListNode(0, head);
  let lead = dummy;
  for (let i = 0; i < n; i++) lead = lead.next;
  let follow = dummy;
  // When lead stands on the last node, follow stands right before the node to drop.
  while (lead.next) {
    lead = lead.next;
    follow = follow.next;
  }
  follow.next = follow.next.next;
  return dummy.next;
}
