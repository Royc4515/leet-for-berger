// Nearly O(c + links + queries) - union-find once, then one forward-only pointer per grid.
func backupStations(c int, links [][]int, queries [][]int) []int {
	parent := make([]int, c)
	for i := range parent {
		parent[i] = i
	}
	// Path halving keeps the trees flat without recursion (a 10^5 line would be too deep).
	find := func(x int) int {
		for parent[x] != x {
			parent[x] = parent[parent[x]]
			x = parent[x]
		}
		return x
	}
	for _, l := range links {
		parent[find(l[0]-1)] = find(l[1] - 1)
	}

	// The stations of the grid with root r sit in order[start[r] .. start[r + 1]), increasing:
	// visiting ids ascending while filling keeps each group sorted.
	root := make([]int, c)
	start := make([]int, c+1)
	for i := 0; i < c; i++ {
		root[i] = find(i)
		start[root[i]+1]++
	}
	for i := 0; i < c; i++ {
		start[i+1] += start[i]
	}
	fill := make([]int, c)
	copy(fill, start[:c])
	order := make([]int, c)
	for i := 0; i < c; i++ {
		order[fill[root[i]]] = i
		fill[root[i]]++
	}
	ptr := make([]int, c)
	copy(ptr, start[:c])
	online := make([]bool, c)
	for i := range online {
		online[i] = true
	}

	answers := []int{}
	for _, q := range queries {
		x := q[1] - 1
		switch {
		case q[0] == 2:
			online[x] = false
		case online[x]:
			answers = append(answers, q[1])
		default:
			r := root[x]
			// A station never comes back online, so the pointer only moves forward: every
			// station is skipped at most once over the whole run.
			for ptr[r] < start[r+1] && !online[order[ptr[r]]] {
				ptr[r]++
			}
			if ptr[r] < start[r+1] {
				answers = append(answers, order[ptr[r]]+1)
			} else {
				answers = append(answers, -1)
			}
		}
	}
	return answers
}
