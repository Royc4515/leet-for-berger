// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0785.Is%20Graph%20Bipartite/Solution.go
// O(V + E) time - color each component by BFS with alternating colors (1 and -1); with BFS,
// a 10^5-node path costs queue space, not call depth.
func isBipartite(graph [][]int) bool {
	n := len(graph)
	color := make([]int, n)
	// Every node is a possible start: the graph may be disconnected.
	for i := 0; i < n; i++ {
		if color[i] != 0 {
			continue
		}
		color[i] = 1
		q := []int{i}
		for head := 0; head < len(q); head++ {
			a := q[head]
			for _, b := range graph[a] {
				if color[b] == color[a] {
					return false
				}
				if color[b] == 0 {
					color[b] = -color[a]
					q = append(q, b)
				}
			}
		}
	}
	return true
}
