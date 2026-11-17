// O(m * n) time, O(1) extra space - the first row and column store which columns and rows to
// clear; two flags remember whether those marker lines held a zero of their own.
func setZeroes(matrix [][]int) [][]int {
	m, n := len(matrix), len(matrix[0])
	firstRowZero, firstColZero := false, false
	for j := 0; j < n; j++ {
		if matrix[0][j] == 0 {
			firstRowZero = true
		}
	}
	for i := 0; i < m; i++ {
		if matrix[i][0] == 0 {
			firstColZero = true
		}
	}
	for i := 1; i < m; i++ {
		for j := 1; j < n; j++ {
			if matrix[i][j] == 0 {
				matrix[i][0] = 0
				matrix[0][j] = 0
			}
		}
	}
	for i := 1; i < m; i++ {
		for j := 1; j < n; j++ {
			if matrix[i][0] == 0 || matrix[0][j] == 0 {
				matrix[i][j] = 0
			}
		}
	}
	// Clear the marker lines last, after every other cell has read them.
	if firstRowZero {
		for j := 0; j < n; j++ {
			matrix[0][j] = 0
		}
	}
	if firstColZero {
		for i := 0; i < m; i++ {
			matrix[i][0] = 0
		}
	}
	return matrix
}
