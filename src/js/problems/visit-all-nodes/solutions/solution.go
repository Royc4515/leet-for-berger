// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0847.Shortest%20Path%20Visiting%20All%20Nodes/Solution.go

// O(2^n * n^2) - BFS over states (node, set of visited nodes as a bitmask). A walk may revisit
// nodes, so the node alone is not a state. All n single-node states start at distance 0, which
// tries every starting node in one search.
func shortestPathLength(n int, edges [][]int) int {
	graph := make([][]int, n)
	for _, e := range edges {
		graph[e[0]] = append(graph[e[0]], e[1])
		graph[e[1]] = append(graph[e[1]], e[0])
	}
	q := [][2]int{}
	vis := make([][]bool, n)
	for i := range vis {
		vis[i] = make([]bool, 1<<n)
		vis[i][1<<i] = true
		q = append(q, [2]int{i, 1 << i})
	}
	for ans := 0; ; ans++ {
		// One BFS layer per step, so ans is the walk length of every state in it.
		for k := len(q); k > 0; k-- {
			p := q[0]
			q = q[1:]
			i, st := p[0], p[1]
			if st == (1<<n)-1 {
				return ans
			}
			for _, j := range graph[i] {
				nst := st | 1<<j
				if !vis[j][nst] {
					vis[j][nst] = true
					q = append(q, [2]int{j, nst})
				}
			}
		}
	}
}
