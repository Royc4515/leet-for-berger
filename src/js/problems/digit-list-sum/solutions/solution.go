// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0002.Add%20Two%20Numbers/Solution.go
// O(max(m, n)) - grade-school addition, one digit per node.
func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
	// A placeholder head avoids special-casing the first output node.
	dummy := &ListNode{}
	carry := 0
	cur := dummy
	// Keep going while a carry is left: 999 + 1 needs one node more than either input.
	for l1 != nil || l2 != nil || carry != 0 {
		s := carry
		if l1 != nil {
			s += l1.Val
		}
		if l2 != nil {
			s += l2.Val
		}
		carry = s / 10
		cur.Next = &ListNode{s % 10, nil}
		cur = cur.Next
		if l1 != nil {
			l1 = l1.Next
		}
		if l2 != nil {
			l2 = l2.Next
		}
	}
	return dummy.Next
}
