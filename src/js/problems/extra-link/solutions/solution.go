// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0684.Redundant%20Connection/Solution.go
// O(n alpha(n)) time - union-find in input order; the first link whose ends are already
// connected closes the cycle, and every other cycle link came before it.
func findRedundantConnection(edges [][]int) []int {
	n := len(edges)
	p := make([]int, n+1)
	size := make([]int, n+1)
	for i := range p {
		p[i] = i
		size[i] = 1
	}
	// Iterative with path halving: a recursive find can go 10^5 deep before compressing.
	find := func(x int) int {
		for p[x] != x {
			p[x] = p[p[x]]
			x = p[x]
		}
		return x
	}
	for _, e := range edges {
		pa, pb := find(e[0]), find(e[1])
		if pa == pb {
			return e
		}
		// Union by size keeps every tree shallow.
		if size[pa] < size[pb] {
			pa, pb = pb, pa
		}
		p[pb] = pa
		size[pa] += size[pb]
	}
	return []int{}
}
