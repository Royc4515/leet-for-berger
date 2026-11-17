// O(n) time, O(w) space - BFS, one level per outer iteration.
func levelOrder(root *TreeNode) [][]int {
	out := [][]int{}
	if root == nil {
		return out
	}
	level := []*TreeNode{root}
	for len(level) > 0 {
		vals := make([]int, len(level))
		// Building the next level as its own slice marks the boundary without counting.
		var next []*TreeNode
		for i, n := range level {
			vals[i] = n.Val
			if n.Left != nil {
				next = append(next, n.Left)
			}
			if n.Right != nil {
				next = append(next, n.Right)
			}
		}
		out = append(out, vals)
		level = next
	}
	return out
}
