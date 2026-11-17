// O(rows * cols) to build, O(1) per query: a 2D prefix table plus inclusion-exclusion.
type NumMatrix struct {
	p [][]int
}

func Constructor(matrix [][]int) NumMatrix {
	rows, cols := len(matrix), len(matrix[0])
	// An extra row and column of zeros, so rectangles touching row 0 or column 0 need no special case.
	p := make([][]int, rows+1)
	for r := range p {
		p[r] = make([]int, cols+1)
	}
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			// The block above and the block to the left overlap in p[r][c], counted twice.
			p[r+1][c+1] = matrix[r][c] + p[r][c+1] + p[r+1][c] - p[r][c]
		}
	}
	return NumMatrix{p: p}
}

func (this *NumMatrix) SumRegion(row1 int, col1 int, row2 int, col2 int) int {
	p := this.p
	// Remove the strip above and the strip to the left, then add back their shared corner.
	return p[row2+1][col2+1] - p[row1][col2+1] - p[row2+1][col1] + p[row1][col1]
}
