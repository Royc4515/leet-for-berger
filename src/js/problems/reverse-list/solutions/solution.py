def reverse_list(head: Optional[ListNode]) -> Optional[ListNode]:
    # O(n) time, O(1) space - iterative rewiring.
    prev = None
    while head is not None:
        # Save the rest of the list before the pointer that leads to it is overwritten.
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev
