// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0079.Word%20Search/Solution.go
// O(rows * cols * 3^len) worst case - backtracking, with two prunes that make the pathological
// boards (one letter everywhere) instant.
func exist(board []string, word string) bool {
	m, n := len(board), len(board[0])
	var have, need [128]int
	for _, row := range board {
		for i := 0; i < len(row); i++ {
			have[row[i]]++
		}
	}
	for i := 0; i < len(word); i++ {
		need[word[i]]++
	}
	// Not enough copies of some letter: no path can exist, so skip the search entirely.
	for c := 0; c < 128; c++ {
		if need[c] > have[c] {
			return false
		}
	}
	w := []byte(word)
	// A path read backwards is still a path. Starting from the rarer end cuts most branches early.
	if have[w[0]] > have[w[len(w)-1]] {
		for i, j := 0, len(w)-1; i < j; i, j = i+1, j-1 {
			w[i], w[j] = w[j], w[i]
		}
	}
	grid := make([][]byte, m)
	for i := range board {
		grid[i] = []byte(board[i])
	}
	dirs := [5]int{-1, 0, 1, 0, -1}
	var dfs func(int, int, int) bool
	dfs = func(i, j, k int) bool {
		if grid[i][j] != w[k] {
			return false
		}
		if k == len(w)-1 {
			return true
		}
		c := grid[i][j]
		// A character that never occurs in a word marks the cell as on the current path.
		grid[i][j] = '#'
		found := false
		for u := 0; u < 4 && !found; u++ {
			x, y := i+dirs[u], j+dirs[u+1]
			found = x >= 0 && x < m && y >= 0 && y < n && dfs(x, y, k+1)
		}
		// Unmark on the way back, or later starting cells would find this cell blocked.
		grid[i][j] = c
		return found
	}
	for i := 0; i < m; i++ {
		for j := 0; j < n; j++ {
			if dfs(i, j, 0) {
				return true
			}
		}
	}
	return false
}
