import (
	"container/heap"
	"math"
)

// minHeap holds (distance, node) pairs ordered by distance.
type minHeap [][2]int

func (h minHeap) Len() int            { return len(h) }
func (h minHeap) Less(i, j int) bool  { return h[i][0] < h[j][0] }
func (h minHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x interface{}) { *h = append(*h, x.([2]int)) }
func (h *minHeap) Pop() interface{} {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

// O((V + E) log V) - Dijkstra with a binary heap. Delays are never negative, so the node with
// the smallest tentative time can no longer improve once it is popped.
func networkDelayTime(times [][]int, n int, k int) int {
	adj := make([][][2]int, n+1)
	for _, t := range times {
		adj[t[0]] = append(adj[t[0]], [2]int{t[1], t[2]})
	}
	dist := make([]int, n+1)
	for i := range dist {
		dist[i] = math.MaxInt
	}
	dist[k] = 0
	h := &minHeap{{0, k}}
	for h.Len() > 0 {
		top := heap.Pop(h).([2]int)
		d, u := top[0], top[1]
		// A stale entry: u was already settled with a smaller time.
		if d > dist[u] {
			continue
		}
		for _, e := range adj[u] {
			if d+e[1] < dist[e[0]] {
				dist[e[0]] = d + e[1]
				heap.Push(h, [2]int{dist[e[0]], e[0]})
			}
		}
	}
	// The last node to hear the signal decides; one that never hears it makes the answer -1.
	ans := 0
	for _, d := range dist[1:] {
		if d > ans {
			ans = d
		}
	}
	if ans == math.MaxInt {
		return -1
	}
	return ans
}
