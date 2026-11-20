// O(n) time: a stack of indexes with increasing heights. A bar that is not taller than the top
// pops it, and then both limits of the popped bar are known.
func largestBlock(heights []int) int {
	n := len(heights)
	stack := make([]int, 0, n+1)
	best := 0
	for i := 0; i <= n; i++ {
		// A height-0 sentinel after the last bar pops everything still waiting.
		h := 0
		if i < n {
			h = heights[i]
		}
		for len(stack) > 0 && heights[stack[len(stack)-1]] >= h {
			height := heights[stack[len(stack)-1]]
			stack = stack[:len(stack)-1]
			// Everything between the new top (exclusive) and i (exclusive) is at least this tall.
			left := -1
			if len(stack) > 0 {
				left = stack[len(stack)-1]
			}
			if area := height * (i - left - 1); area > best {
				best = area
			}
		}
		stack = append(stack, i)
	}
	return best
}
