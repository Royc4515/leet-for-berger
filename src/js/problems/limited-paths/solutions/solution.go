// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1600-1699/1697.Checking%20Existence%20of%20Edge%20Length%20Limited%20Paths/Solution.go
import "sort"

// O(E log E + Q log Q) - answer the queries offline in increasing limit. The usable edge set
// only grows with the limit, so one union-find, fed edges in increasing length, serves every
// query.
func distanceLimitedPathsExist(n int, edgeList [][]int, queries [][]int) []bool {
	p := make([]int, n)
	size := make([]int, n)
	for i := range p {
		p[i] = i
		size[i] = 1
	}
	// Iterative with path halving: no recursion depth to worry about on a path graph.
	find := func(x int) int {
		for p[x] != x {
			p[x] = p[p[x]]
			x = p[x]
		}
		return x
	}
	edges := append([][]int(nil), edgeList...)
	sort.Slice(edges, func(i, j int) bool { return edges[i][2] < edges[j][2] })
	// Sorting indexes, not the queries, keeps track of where each answer belongs.
	qid := make([]int, len(queries))
	for i := range qid {
		qid[i] = i
	}
	sort.Slice(qid, func(i, j int) bool { return queries[qid[i]][2] < queries[qid[j]][2] })
	ans := make([]bool, len(queries))
	j := 0
	for _, i := range qid {
		a, b, limit := queries[i][0], queries[i][1], queries[i][2]
		// Strictly shorter: an edge equal to the limit stays out.
		for ; j < len(edges) && edges[j][2] < limit; j++ {
			u, v := find(edges[j][0]), find(edges[j][1])
			if u != v {
				if size[u] < size[v] {
					u, v = v, u
				}
				p[v] = u
				size[u] += size[v]
			}
		}
		ans[i] = find(a) == find(b)
	}
	return ans
}
