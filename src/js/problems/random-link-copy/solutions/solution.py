def copy_random_list(head: Optional[RandomListNode]) -> Optional[RandomListNode]:
    # O(n) time and space. Pass 1 makes a copy of every node; pass 2 wires both pointers through
    # the map, keyed by the original node itself (values can repeat).
    copy_of = {None: None}
    node = head
    while node is not None:
        copy_of[node] = RandomListNode(node.val)
        node = node.next
    node = head
    while node is not None:
        copy_of[node].next = copy_of[node.next]
        copy_of[node].random = copy_of[node.random]
        node = node.next
    return copy_of[head]
