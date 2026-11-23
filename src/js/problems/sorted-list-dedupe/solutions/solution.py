def dedupe_sorted_list(head: Optional[ListNode]) -> Optional[ListNode]:
    # O(n) time, O(1) extra space: skip adjacent equal nodes without advancing until the value changes.
    curr = head
    while curr is not None and curr.next is not None:
        if curr.val == curr.next.val:
            curr.next = curr.next.next
        else:
            curr = curr.next
    return head
