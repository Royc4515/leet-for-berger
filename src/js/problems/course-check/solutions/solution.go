// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0207.Course%20Schedule/Solution.go
// O(V + E) time - Kahn's algorithm; iterative, so 10^5-long chains need no deep recursion.
func canFinish(numCourses int, prerequisites [][]int) bool {
	g := make([][]int, numCourses)
	indeg := make([]int, numCourses)
	for _, p := range prerequisites {
		a, b := p[0], p[1]
		g[b] = append(g[b], a)
		indeg[a]++
	}
	q := []int{}
	for i, d := range indeg {
		if d == 0 {
			q = append(q, i)
		}
	}
	// The slice only grows, so a head index acts as the queue front.
	for head := 0; head < len(q); head++ {
		for _, j := range g[q[head]] {
			indeg[j]--
			if indeg[j] == 0 {
				q = append(q, j)
			}
		}
	}
	// Courses on a cycle never reach in-degree 0, so they are never queued.
	return len(q) == numCourses
}
