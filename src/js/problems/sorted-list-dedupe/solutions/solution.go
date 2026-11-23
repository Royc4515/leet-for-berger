// O(n) time, O(1) extra space: skip adjacent equal nodes without advancing until the value changes.
func dedupeSortedList(head *ListNode) *ListNode {
	curr := head
	for curr != nil && curr.Next != nil {
		if curr.Val == curr.Next.Val {
			curr.Next = curr.Next.Next
		} else {
			curr = curr.Next
		}
	}
	return head
}
