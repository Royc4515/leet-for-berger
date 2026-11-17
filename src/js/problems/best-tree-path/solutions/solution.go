// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0124.Binary%20Tree%20Maximum%20Path%20Sum/Solution.go
import "math"

// O(n) time, O(h) stack. Each node returns its best downward chain; the answer also tries the
// path that bends at the node and uses both chains.
func maxPathSum(root *TreeNode) int {
	best := math.MinInt
	var down func(*TreeNode) int
	down = func(node *TreeNode) int {
		if node == nil {
			return 0
		}
		// A negative chain only lowers the sum, so it is dropped (counted as 0).
		left := max(0, down(node.Left))
		right := max(0, down(node.Right))
		best = max(best, node.Val+left+right)
		// The parent can extend only one side: a path cannot fork.
		return node.Val + max(left, right)
	}
	down(root)
	return best
}
