// O(n) time, O(1) space - iterative rewiring.
func reverseList(head *ListNode) *ListNode {
	var prev *ListNode
	for head != nil {
		// Save the rest of the list before the pointer that leads to it is overwritten.
		next := head.Next
		head.Next = prev
		prev = head
		head = next
	}
	return prev
}
