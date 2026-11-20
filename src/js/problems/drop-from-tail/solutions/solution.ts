// O(n) time in one pass, O(1) space: a second pointer trails the first by n nodes.
function dropFromTail(head: ListNode | null, n: number): ListNode | null {
  // The placeholder gives the head a predecessor, so dropping the head is not a special case.
  const dummy = new ListNode(0, head);
  let lead: ListNode = dummy;
  for (let i = 0; i < n; i++) lead = lead.next!;
  let follow: ListNode = dummy;
  // When lead stands on the last node, follow stands right before the node to drop.
  while (lead.next) {
    lead = lead.next;
    follow = follow.next!;
  }
  follow.next = follow.next!.next;
  return dummy.next;
}
