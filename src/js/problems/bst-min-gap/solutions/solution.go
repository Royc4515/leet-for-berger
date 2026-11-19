// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0783.Minimum%20Distance%20Between%20BST%20Nodes/Solution.go
// O(n) time, O(h) space: in-order visits a BST in ascending order, and in a sorted list the
// closest pair is always two neighbors, so compare each value with the one visited before it.
func minGap(root *TreeNode) int {
	// -2^30 as "no previous value" makes the first difference too large to ever win.
	const inf int = 1 << 30
	ans, pre := inf, -inf
	var dfs func(*TreeNode)
	dfs = func(node *TreeNode) {
		if node == nil {
			return
		}
		dfs(node.Left)
		ans = min(ans, node.Val-pre)
		pre = node.Val
		dfs(node.Right)
	}
	dfs(root)
	return ans
}
