// O(n) time in one pass, O(1) space: a second pointer trails the first by n nodes.
func dropFromTail(head *ListNode, n int) *ListNode {
	// The placeholder gives the head a predecessor, so dropping the head is not a special case.
	dummy := &ListNode{Next: head}
	lead := dummy
	for i := 0; i < n; i++ {
		lead = lead.Next
	}
	follow := dummy
	// When lead stands on the last node, follow stands right before the node to drop.
	for lead.Next != nil {
		lead = lead.Next
		follow = follow.Next
	}
	follow.Next = follow.Next.Next
	return dummy.Next
}
