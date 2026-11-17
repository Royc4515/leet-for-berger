// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0061.Rotate%20List/Solution.go
// O(n) time, O(1) space: count, reduce k, then cut once with two pointers.
func rotateRight(head *ListNode, k int) *ListNode {
	// Checking for an empty list first also avoids k % 0 below.
	if head == nil || head.Next == nil {
		return head
	}
	cur := head
	n := 0
	for cur != nil {
		cur = cur.Next
		n++
	}
	// Every n rotations is a full turn, so only k mod n steps matter.
	k %= n
	if k == 0 {
		return head
	}
	// fast runs k nodes ahead; when it reaches the tail, slow is the node before the new head.
	fast, slow := head, head
	for i := 0; i < k; i++ {
		fast = fast.Next
	}
	for fast.Next != nil {
		fast = fast.Next
		slow = slow.Next
	}
	ans := slow.Next
	slow.Next = nil
	fast.Next = head
	return ans
}
