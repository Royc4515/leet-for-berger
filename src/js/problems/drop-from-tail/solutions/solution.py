def drop_from_tail(head: Optional[ListNode], n: int) -> Optional[ListNode]:
    # O(n) time in one pass, O(1) space: a second pointer trails the first by n nodes.
    # The placeholder gives the head a predecessor, so dropping the head is not a special case.
    dummy = ListNode(0, head)
    lead = dummy
    for _ in range(n):
        lead = lead.next
    follow = dummy
    # When lead stands on the last node, follow stands right before the node to drop.
    while lead.next is not None:
        lead = lead.next
        follow = follow.next
    follow.next = follow.next.next
    return dummy.next
