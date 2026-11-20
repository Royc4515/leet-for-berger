// O(n) time, O(h) space: carry the number the path reads so far down to the leaves.
func digitPathTotal(root *TreeNode) int {
	var walk func(node *TreeNode, above int) int
	walk = func(node *TreeNode, above int) int {
		if node == nil {
			return 0
		}
		// Appending a digit to a decimal number: multiply by ten, then add it.
		here := above*10 + node.Val
		// Only a node with no children ends a path; a missing child contributes nothing.
		if node.Left == nil && node.Right == nil {
			return here
		}
		return walk(node.Left, here) + walk(node.Right, here)
	}
	return walk(root, 0)
}
