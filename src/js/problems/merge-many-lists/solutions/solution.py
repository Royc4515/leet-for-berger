# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0023.Merge%20k%20Sorted%20Lists/Solution.py
from heapq import heapify, heappop, heappush


def merge_k_lists(lists: list[Optional[ListNode]]) -> Optional[ListNode]:
    # O(N log k): a min-heap holds the current head of every non-empty list.
    # The list index breaks ties between equal values, so nodes themselves are never compared.
    pq = [(head.val, i, head) for i, head in enumerate(lists) if head]
    heapify(pq)
    dummy = cur = ListNode()
    while pq:
        _, i, node = heappop(pq)
        if node.next:
            heappush(pq, (node.next.val, i, node.next))
        cur.next = node
        cur = node
    return dummy.next
