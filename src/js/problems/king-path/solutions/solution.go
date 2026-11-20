// O(n^2) time and space: breadth-first search by waves from the top-left cell. Every move costs
// one, so the wave that first holds the target is the shortest route.
func shortestClearPath(grid [][]int) int {
	n := len(grid)
	if grid[0][0] == 1 || grid[n-1][n-1] == 1 {
		return -1
	}
	seen := make([]bool, n*n)
	seen[0] = true
	frontier := []int{0}
	cells := 1
	for len(frontier) > 0 {
		var next []int
		for _, cell := range frontier {
			r, c := cell/n, cell%n
			if r == n-1 && c == n-1 {
				return cells
			}
			for dr := -1; dr <= 1; dr++ {
				for dc := -1; dc <= 1; dc++ {
					nr, nc := r+dr, c+dc
					if nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] == 0 && !seen[nr*n+nc] {
						// Marking when queued, not when taken out, so a cell joins the queue once.
						seen[nr*n+nc] = true
						next = append(next, nr*n+nc)
					}
				}
			}
		}
		frontier = next
		cells++
	}
	return -1
}
