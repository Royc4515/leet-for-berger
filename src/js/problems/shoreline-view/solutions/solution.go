// O(n) time, O(n) space: a monotonic stack of indices whose heights strictly decrease.
func shorelineView(heights []int) []int {
	stack := make([]int, 0, len(heights))
	for i, h := range heights {
		// A building at least as tall as the one on top blocks it for good (equal heights block too).
		for len(stack) > 0 && heights[stack[len(stack)-1]] <= h {
			stack = stack[:len(stack)-1]
		}
		stack = append(stack, i)
	}
	// What is left sees the sea, already in increasing index order.
	return stack
}
