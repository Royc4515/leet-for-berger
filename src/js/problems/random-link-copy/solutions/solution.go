// O(n) time and space. Pass 1 makes a copy of every node; pass 2 wires both pointers through the
// map, keyed by the original node itself (values can repeat).
func copyRandomList(head *RandomListNode) *RandomListNode {
	copyOf := map[*RandomListNode]*RandomListNode{nil: nil}
	for node := head; node != nil; node = node.Next {
		copyOf[node] = &RandomListNode{Val: node.Val}
	}
	for node := head; node != nil; node = node.Next {
		copyOf[node].Next = copyOf[node.Next]
		copyOf[node].Random = copyOf[node.Random]
	}
	return copyOf[head]
}
