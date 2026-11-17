// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0289.Game%20of%20Life/Solution.go
// O(m * n) time, O(1) extra space - update in place with two transitional states that still
// remember the current generation: 2 = alive now, dead next; -1 = dead now, alive next.
// "board[x][y] > 0" is then exactly "alive now", whatever has been rewritten already.
func nextGeneration(board [][]int) [][]int {
	m, n := len(board), len(board[0])
	for i := 0; i < m; i++ {
		for j, v := range board[i] {
			// The 3 x 3 scan below counts the cell itself; start at minus its own state.
			live := -v
			for x := i - 1; x <= i+1; x++ {
				for y := j - 1; y <= j+1; y++ {
					if x >= 0 && x < m && y >= 0 && y < n && board[x][y] > 0 {
						live++
					}
				}
			}
			if v == 1 && (live < 2 || live > 3) {
				board[i][j] = 2
			}
			if v == 0 && live == 3 {
				board[i][j] = -1
			}
		}
	}
	// Second pass: settle the transitional states into the next generation.
	for i := 0; i < m; i++ {
		for j, v := range board[i] {
			if v == 2 {
				board[i][j] = 0
			}
			if v == -1 {
				board[i][j] = 1
			}
		}
	}
	return board
}
