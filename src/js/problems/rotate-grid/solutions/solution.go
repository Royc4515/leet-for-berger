// O(n^2) time, O(1) extra space - a clockwise quarter turn is a transpose followed by
// mirroring each row, and both moves are plain swaps.
func rotateGrid(matrix [][]int) [][]int {
	n := len(matrix)
	for i := 0; i < n; i++ {
		// Start at i + 1 so each off-diagonal pair is swapped once, not swapped back.
		for j := i + 1; j < n; j++ {
			matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
		}
	}
	for _, row := range matrix {
		for l, r := 0, n-1; l < r; l, r = l+1, r-1 {
			row[l], row[r] = row[r], row[l]
		}
	}
	return matrix
}
