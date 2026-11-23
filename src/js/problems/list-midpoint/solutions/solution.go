// O(n) time, O(1) extra space: advance slow by 1 and fast by 2 to land on floor(n / 2).
func middleNode(head *ListNode) *ListNode {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
	}
	return slow
}
