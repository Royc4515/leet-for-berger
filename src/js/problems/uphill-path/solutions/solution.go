import "sort"

// O(mn log mn) time, O(mn) space. Cells are settled from the largest value down, so every
// strictly larger neighbor is already final. No recursion: a path can be 40,000 cells long.
func longestIncreasingPath(matrix [][]int) int {
	m, n := len(matrix), len(matrix[0])
	order := make([]int, m*n)
	for c := range order {
		order[c] = c
	}
	sort.Slice(order, func(a, b int) bool {
		return matrix[order[a]/n][order[a]%n] > matrix[order[b]/n][order[b]%n]
	})
	best := make([]int, m*n)
	answer := 0
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	for _, c := range order {
		i, j, length := c/n, c%n, 1
		for _, d := range dirs {
			x, y := i+d[0], j+d[1]
			if x >= 0 && x < m && y >= 0 && y < n && matrix[x][y] > matrix[i][j] {
				length = max(length, best[x*n+y]+1)
			}
		}
		best[c] = length
		answer = max(answer, length)
	}
	return answer
}
