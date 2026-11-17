// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0210.Course%20Schedule%20II/Solution.go
import "container/heap"

// minHeap adapts a slice of ints to container/heap, smallest first.
type minHeap []int

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *minHeap) Pop() any {
	old := *h
	v := old[len(old)-1]
	*h = old[:len(old)-1]
	return v
}

// O((V + E) log V) time - Kahn's algorithm with a min-heap instead of a FIFO queue, so the
// smallest available course is always taken next, which yields the smallest order.
func findOrder(numCourses int, prerequisites [][]int) []int {
	g := make([][]int, numCourses)
	indeg := make([]int, numCourses)
	for _, p := range prerequisites {
		a, b := p[0], p[1]
		g[b] = append(g[b], a)
		indeg[a]++
	}
	h := &minHeap{}
	for i, d := range indeg {
		if d == 0 {
			heap.Push(h, i)
		}
	}
	ans := []int{}
	for h.Len() > 0 {
		i := heap.Pop(h).(int)
		ans = append(ans, i)
		for _, j := range g[i] {
			indeg[j]--
			if indeg[j] == 0 {
				heap.Push(h, j)
			}
		}
	}
	// Courses on a cycle are never released, so a short order means no valid order exists.
	if len(ans) < numCourses {
		return []int{}
	}
	return ans
}
