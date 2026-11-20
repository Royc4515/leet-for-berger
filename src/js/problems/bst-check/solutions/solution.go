// O(n) time, O(h) space: every node must lie strictly inside the interval its ancestors allow.
func isValidBst(root *TreeNode) bool {
	// Go's int is 64 bits here, so bounds far outside the 32-bit range play the role of "no
	// bound" and a node that is exactly -2^31 or 2^31 - 1 still fits.
	const none = 1 << 40
	var check func(node *TreeNode, low, high int) bool
	check = func(node *TreeNode, low, high int) bool {
		if node == nil {
			return true
		}
		if node.Val <= low || node.Val >= high {
			return false
		}
		// Going left, this value caps the interval from above; going right, from below.
		return check(node.Left, low, node.Val) && check(node.Right, node.Val, high)
	}
	return check(root, -none, none)
}
