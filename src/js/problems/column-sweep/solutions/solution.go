// O(n) time and space: a level-order walk appends values to their column in exactly the required
// order (higher first, left before right), so nothing needs sorting.
func columnOrder(root *TreeNode) [][]int {
	if root == nil {
		return [][]int{}
	}
	type item struct {
		node *TreeNode
		col  int
	}
	columns := map[int][]int{}
	low, high := 0, 0
	queue := []item{{root, 0}}
	for head := 0; head < len(queue); head++ {
		cur := queue[head]
		columns[cur.col] = append(columns[cur.col], cur.node.Val)
		if cur.col < low {
			low = cur.col
		}
		if cur.col > high {
			high = cur.col
		}
		if cur.node.Left != nil {
			queue = append(queue, item{cur.node.Left, cur.col - 1})
		}
		if cur.node.Right != nil {
			queue = append(queue, item{cur.node.Right, cur.col + 1})
		}
	}
	// Columns are met in no particular order, but they form one contiguous range.
	out := make([][]int, 0, high-low+1)
	for c := low; c <= high; c++ {
		out = append(out, columns[c])
	}
	return out
}
