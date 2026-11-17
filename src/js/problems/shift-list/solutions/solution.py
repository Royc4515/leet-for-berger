# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0061.Rotate%20List/Solution.py
def rotate_right(head: Optional[ListNode], k: int) -> Optional[ListNode]:
    # O(n) time, O(1) space: count, reduce k, then cut once with two pointers.
    # Checking for an empty list first also avoids k % 0 below.
    if head is None or head.next is None:
        return head
    cur, n = head, 0
    while cur:
        n += 1
        cur = cur.next
    # Every n rotations is a full turn, so only k mod n steps matter.
    k %= n
    if k == 0:
        return head
    # fast runs k nodes ahead; when it reaches the tail, slow is the node before the new head.
    fast = slow = head
    for _ in range(k):
        fast = fast.next
    while fast.next:
        fast, slow = fast.next, slow.next

    ans = slow.next
    slow.next = None
    fast.next = head
    return ans
