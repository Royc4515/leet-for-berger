// O(1) per call, O(n) memory: signed counters per row, column and diagonal (+1 for player 1,
// -1 for player 2). A line is complete for one player exactly when its counter is +-n.
type GridDuel struct {
	n          int
	rows, cols []int
	diag, anti int
}

func Constructor(n int) GridDuel {
	return GridDuel{n: n, rows: make([]int, n), cols: make([]int, n)}
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func (this *GridDuel) Play(row int, col int, player int) int {
	d := -1
	if player == 1 {
		d = 1
	}
	this.rows[row] += d
	this.cols[col] += d
	// The diagonals only count the cells that lie on them.
	if row == col {
		this.diag += d
	}
	if row+col == this.n-1 {
		this.anti += d
	}
	n := this.n
	if abs(this.rows[row]) == n || abs(this.cols[col]) == n || abs(this.diag) == n || abs(this.anti) == n {
		return player
	}
	return 0
}
