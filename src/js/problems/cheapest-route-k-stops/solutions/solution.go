// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0787.Cheapest%20Flights%20Within%20K%20Stops/Solution.go

// O(k * E) - Bellman-Ford limited to k + 1 rounds: after round j, dist holds the cheapest cost
// using at most j flights.
func findCheapestPrice(n int, flights [][]int, src int, dst int, k int) int {
	// Far above any real cost (at most 99 flights of 10^4) and safe to add a price to.
	const inf = 0x3f3f3f3f
	dist := make([]int, n)
	backup := make([]int, n)
	for i := range dist {
		dist[i] = inf
	}
	dist[src] = 0
	for i := 0; i < k+1; i++ {
		// Every flight reads the previous round's costs; relaxing in place could chain several
		// flights in one round and break the stop limit.
		copy(backup, dist)
		changed := false
		for _, e := range flights {
			f, t, p := e[0], e[1], e[2]
			if backup[f]+p < dist[t] {
				dist[t] = backup[f] + p
				changed = true
			}
		}
		// Nothing improved, so more rounds cannot improve anything either.
		if !changed {
			break
		}
	}
	if dist[dst] == inf {
		return -1
	}
	return dist[dst]
}
