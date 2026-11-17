// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0230.Kth%20Smallest%20Element%20in%20a%20BST/Solution.go
// O(h + k) time, O(h) space: an in-order walk of a BST yields values in ascending order, so the
// k-th node popped is the answer and the rest of the tree is never visited.
func kthSmallest(root *TreeNode, k int) int {
	stk := []*TreeNode{}
	for root != nil || len(stk) > 0 {
		if root != nil {
			stk = append(stk, root)
			root = root.Left
		} else {
			root = stk[len(stk)-1]
			stk = stk[:len(stk)-1]
			k--
			if k == 0 {
				return root.Val
			}
			root = root.Right
		}
	}
	return -1
}
