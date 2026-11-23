def middle_node(head: Optional[ListNode]) -> Optional[ListNode]:
    # O(n) time, O(1) extra space: advance slow by 1 and fast by 2 to land on floor(n / 2).
    slow = head
    fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow
