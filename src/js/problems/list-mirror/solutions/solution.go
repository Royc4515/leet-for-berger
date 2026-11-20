// O(n) time, O(1) space: find the middle, reverse the second half in place, compare the halves.
func isMirror(head *ListNode) bool {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
	}

	// slow is the first node of the second half (the middle node itself for an odd length).
	var prev *ListNode
	for slow != nil {
		// Save the rest of the list before the pointer that leads to it is overwritten.
		next := slow.Next
		slow.Next = prev
		prev = slow
		slow = next
	}

	// The reversed half is the shorter or equal one, so it decides when to stop: for an odd length
	// the middle node is simply never paired with anything.
	left, right := head, prev
	for right != nil {
		if left.Val != right.Val {
			return false
		}
		left = left.Next
		right = right.Next
	}
	return true
}
