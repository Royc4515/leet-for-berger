// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0337.House%20Robber%20III/Solution.go
// O(n) time, O(h) stack. Each node returns (taken, skipped) totals for its subtree, so no
// subtree is ever solved twice.
func rob(root *TreeNode) int {
	var dfs func(*TreeNode) (int, int)
	dfs = func(node *TreeNode) (int, int) {
		if node == nil {
			return 0, 0
		}
		leftTake, leftSkip := dfs(node.Left)
		rightTake, rightSkip := dfs(node.Right)
		// Taking the node forces both children to be skipped; skipping it frees them.
		return node.Val + leftSkip + rightSkip, max(leftTake, leftSkip) + max(rightTake, rightSkip)
	}
	take, skip := dfs(root)
	return max(take, skip)
}
