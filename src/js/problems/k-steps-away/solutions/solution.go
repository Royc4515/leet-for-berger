// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0863.All%20Nodes%20Distance%20K%20in%20Binary%20Tree/Solution.go
import "sort"

// O(n + m log m): nodes only point down, so record every parent first; then the tree is an
// undirected graph and k rounds of breadth-first search from the target reach exactly distance k.
func kStepsAway(root *TreeNode, target int, k int) []int {
	parent := map[*TreeNode]*TreeNode{root: nil}
	start := root
	queue := []*TreeNode{root}
	for h := 0; h < len(queue); h++ {
		node := queue[h]
		if node.Val == target {
			start = node
		}
		for _, child := range []*TreeNode{node.Left, node.Right} {
			if child != nil {
				parent[child] = node
				queue = append(queue, child)
			}
		}
	}
	// The seen set stops the search from stepping back to where it came from.
	seen := map[*TreeNode]bool{start: true}
	frontier := []*TreeNode{start}
	for step := 0; step < k && len(frontier) > 0; step++ {
		next := []*TreeNode{}
		for _, node := range frontier {
			for _, nb := range []*TreeNode{node.Left, node.Right, parent[node]} {
				if nb != nil && !seen[nb] {
					seen[nb] = true
					next = append(next, nb)
				}
			}
		}
		frontier = next
	}
	out := make([]int, 0, len(frontier))
	for _, node := range frontier {
		out = append(out, node.Val)
	}
	sort.Ints(out)
	return out
}
