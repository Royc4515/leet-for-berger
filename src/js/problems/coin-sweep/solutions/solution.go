// O(n) - peel the tree from the outside. A closed walk over the m nodes that must be visited
// crosses each of their m - 1 edges twice, so the answer is 2 * (m - 1).
func collectCoins(coins []int, edges [][]int) int {
	n := len(coins)
	hasCoin := false
	for _, c := range coins {
		if c == 1 {
			hasCoin = true
		}
	}
	if !hasCoin {
		return 0
	}
	// For each node: its degree and the xor of its neighbours' numbers. A leaf has one neighbour,
	// so its xor is that neighbour, and no adjacency lists are needed.
	deg := make([]int, n)
	xr := make([]int, n)
	for _, e := range edges {
		deg[e[0]]++
		deg[e[1]]++
		xr[e[0]] ^= e[1]
		xr[e[1]] ^= e[0]
	}
	gone := make([]bool, n)
	alive := n

	// Pass 1: a leaf without a coin is never worth visiting. Removing one may expose another.
	queue := []int{}
	for v := 0; v < n; v++ {
		if deg[v] == 1 && coins[v] == 0 {
			gone[v] = true
			queue = append(queue, v)
		}
	}
	for head := 0; head < len(queue); head++ {
		v := queue[head]
		alive--
		p := xr[v]
		xr[p] ^= v
		deg[p]--
		if deg[p] == 1 && coins[p] == 0 && !gone[p] {
			gone[p] = true
			queue = append(queue, p)
		}
	}

	// Pass 2, twice: a coin within distance 2 of the walk is collected from there, so the two
	// outermost layers of nodes need not be visited, whatever they hold.
	for round := 0; round < 2; round++ {
		leaves := []int{}
		for v := 0; v < n; v++ {
			if !gone[v] && deg[v] == 1 {
				leaves = append(leaves, v)
			}
		}
		for _, v := range leaves {
			gone[v] = true
			alive--
			// If the only neighbour was a leaf too (two nodes left), it is already gone.
			if deg[v] == 1 {
				p := xr[v]
				xr[p] ^= v
				deg[p]--
			}
		}
	}
	return max(0, 2*(alive-1))
}
