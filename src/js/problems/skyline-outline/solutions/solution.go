// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0218.The%20Skyline%20Problem/Solution.go
import (
	"container/heap"
	"sort"
)

type Matrix struct{ left, right, height int }

// Queue is a max-heap of buildings by height.
type Queue []Matrix

func (q Queue) Len() int           { return len(q) }
func (q Queue) Top() Matrix        { return q[0] }
func (q Queue) Swap(i, j int)      { q[i], q[j] = q[j], q[i] }
func (q Queue) Less(i, j int) bool { return q[i].height > q[j].height }
func (q *Queue) Push(x any)        { *q = append(*q, x.(Matrix)) }
func (q *Queue) Pop() any {
	old, x := *q, (*q)[len(*q)-1]
	*q = old[:len(old)-1]
	return x
}

// O(n log n) - sweep the edges left to right with a max-heap of the buildings already started.
// Finished buildings are removed lazily, only when they reach the top: the top is all that
// matters, and searching the heap for them would be O(n).
func getSkyline(buildings [][]int) [][]int {
	skys, lines, pq := make([][]int, 0), make([]int, 0), &Queue{}
	heap.Init(pq)
	for _, v := range buildings {
		lines = append(lines, v[0], v[1])
	}
	sort.Ints(lines)
	city, n := 0, len(buildings)
	for _, line := range lines {
		for ; city < n && buildings[city][0] <= line; city++ {
			heap.Push(pq, Matrix{left: buildings[city][0], right: buildings[city][1], height: buildings[city][2]})
		}
		for pq.Len() > 0 && pq.Top().right <= line {
			heap.Pop(pq)
		}
		high := 0
		if pq.Len() != 0 {
			high = pq.Top().height
		}
		// Only a change of height is a key point; a repeated x gives the same height again.
		if len(skys) > 0 && skys[len(skys)-1][1] == high {
			continue
		}
		skys = append(skys, []int{line, high})
	}
	return skys
}
