// O(rows * cols) - 0-1 BFS. Entering an empty cell costs 0 and an obstacle costs 1, so a deque
// kept in order of cost replaces Dijkstra's heap: 0-cost moves go to the front.
func minimumObstacles(grid [][]int) int {
	m, n := len(grid), len(grid[0])
	total := m * n
	dist := make([]int, total)
	for i := range dist {
		dist[i] = total
	}
	dist[0] = 0
	// Go has no deque, so a ring buffer stands in. A cell is queued only when its cost
	// strictly drops, and the deque only ever holds costs d and d + 1, so that happens at
	// most twice: 4 * cells + 1 slots leave ample room.
	capacity := 4*total + 1
	ring := make([]int, capacity)
	head, size := 0, 1
	dr := [4]int{-1, 1, 0, 0}
	dc := [4]int{0, 0, -1, 1}
	for size > 0 {
		cur := ring[head]
		head = (head + 1) % capacity
		size--
		r, c := cur/n, cur%n
		for k := 0; k < 4; k++ {
			nr, nc := r+dr[k], c+dc[k]
			if nr < 0 || nr >= m || nc < 0 || nc >= n {
				continue
			}
			w, next := grid[nr][nc], nr*n+nc
			// Only a strict improvement is queued, so stale entries cost nothing extra.
			if dist[cur]+w >= dist[next] {
				continue
			}
			dist[next] = dist[cur] + w
			if w == 0 {
				head = (head - 1 + capacity) % capacity
				ring[head] = next
			} else {
				ring[(head+size)%capacity] = next
			}
			size++
		}
	}
	return dist[total-1]
}
