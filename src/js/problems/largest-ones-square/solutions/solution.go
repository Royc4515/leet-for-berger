// O(rows * cols) time, O(cols) extra space: rolling 1D DP tracking largest square side ending at (r, c).
func largestSquareArea(grid [][]int) int {
	cols := len(grid[0])
	dp := make([]int, cols+1)
	best := 0
	for _, row := range grid {
		prevDiag := 0
		for c := 0; c < cols; c++ {
			saved := dp[c+1]
			if row[c] == 1 {
				m := dp[c+1]
				if dp[c] < m {
					m = dp[c]
				}
				if prevDiag < m {
					m = prevDiag
				}
				side := m + 1
				dp[c+1] = side
				if side > best {
					best = side
				}
			} else {
				dp[c+1] = 0
			}
			prevDiag = saved
		}
	}
	return best * best
}
