# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0002.Add%20Two%20Numbers/Solution.py
def add_two_numbers(l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
    # O(max(m, n)) - grade-school addition, one digit per node.
    # A placeholder head avoids special-casing the first output node.
    dummy = ListNode()
    carry, curr = 0, dummy
    # Keep going while a carry is left: 999 + 1 needs one node more than either input.
    while l1 or l2 or carry:
        s = (l1.val if l1 else 0) + (l2.val if l2 else 0) + carry
        carry, val = divmod(s, 10)
        curr.next = ListNode(val)
        curr = curr.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next
