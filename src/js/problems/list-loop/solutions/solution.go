// O(n) time, O(1) space: a fast pointer gains one node per step on a slow one, so inside a loop
// it must land on the slow pointer; without a loop it falls off the end first.
func hasCycle(head *ListNode) bool {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
		if slow == fast {
			return true
		}
	}
	return false
}
