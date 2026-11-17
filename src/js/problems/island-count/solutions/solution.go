// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0200.Number%20of%20Islands/Solution.go
// O(rows * cols) time - flood fill each new island once, with an explicit stack so the depth
// of a snake-shaped island does not depend on the call stack.
func countIslands(grid []string) int {
	m, n := len(grid), len(grid[0])
	seen := make([]bool, m*n)
	dirs := []int{-1, 0, 1, 0, -1}
	stack := []int{}
	ans := 0
	for i := 0; i < m; i++ {
		for j := 0; j < n; j++ {
			if grid[i][j] != '1' || seen[i*n+j] {
				continue
			}
			ans++
			seen[i*n+j] = true
			stack = append(stack, i*n+j)
			for len(stack) > 0 {
				cell := stack[len(stack)-1]
				stack = stack[:len(stack)-1]
				r, c := cell/n, cell%n
				for k := 0; k < 4; k++ {
					x, y := r+dirs[k], c+dirs[k+1]
					// Mark on push, not on pop, so no cell enters the stack twice.
					if x >= 0 && x < m && y >= 0 && y < n && grid[x][y] == '1' && !seen[x*n+y] {
						seen[x*n+y] = true
						stack = append(stack, x*n+y)
					}
				}
			}
		}
	}
	return ans
}
