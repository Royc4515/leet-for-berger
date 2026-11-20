// O(rows * cols) time and space: BFS in waves, with every rotten cell in the first wave.
func minutesToRot(grid [][]int) int {
	rows, cols := len(grid), len(grid[0])
	var frontier [][2]int
	fresh := 0
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if grid[r][c] == 2 {
				frontier = append(frontier, [2]int{r, c})
			} else if grid[r][c] == 1 {
				fresh++
			}
		}
	}

	dirs := [5]int{-1, 0, 1, 0, -1}
	minutes := 0
	// Stopping as soon as no fresh fruit is left keeps the final wave, which rots nothing, from
	// being counted as a minute.
	for len(frontier) > 0 && fresh > 0 {
		var next [][2]int
		for _, cell := range frontier {
			for d := 0; d < 4; d++ {
				nr, nc := cell[0]+dirs[d], cell[1]+dirs[d+1]
				if nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 {
					// Marking when queued, not when popped, so a cell joins a wave once.
					grid[nr][nc] = 2
					fresh--
					next = append(next, [2]int{nr, nc})
				}
			}
		}
		frontier = next
		minutes++
	}
	if fresh > 0 {
		return -1
	}
	return minutes
}
