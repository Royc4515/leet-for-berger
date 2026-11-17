def has_cycle(head: Optional[ListNode]) -> bool:
    # O(n) time, O(1) space: a fast pointer gains one node per step on a slow one, so inside a
    # loop it must land on the slow pointer; without a loop it falls off the end first.
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
