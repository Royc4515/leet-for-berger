def is_mirror(head: Optional[ListNode]) -> bool:
    # O(n) time, O(1) space: find the middle, reverse the second half in place, compare the halves.
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # slow is the first node of the second half (the middle node itself for an odd length).
    prev = None
    while slow:
        # Save the rest of the list before the pointer that leads to it is overwritten.
        nxt = slow.next
        slow.next = prev
        prev = slow
        slow = nxt

    # The reversed half is the shorter or equal one, so it decides when to stop: for an odd length
    # the middle node is simply never paired with anything.
    left, right = head, prev
    while right:
        if left.val != right.val:
            return False
        left = left.next
        right = right.next
    return True
