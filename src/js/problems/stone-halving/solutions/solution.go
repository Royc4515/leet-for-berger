// O(n + k log n) time - halving the current largest pile always removes the most stones.
// The max-heap is a plain slice with a sift-down, no container/heap boilerplate needed.
func minStoneSum(piles []int, k int) int {
	heap := append([]int(nil), piles...)
	siftDown := func(i int) {
		for {
			largest, left, right := i, 2*i+1, 2*i+2
			if left < len(heap) && heap[left] > heap[largest] {
				largest = left
			}
			if right < len(heap) && heap[right] > heap[largest] {
				largest = right
			}
			if largest == i {
				return
			}
			heap[largest], heap[i] = heap[i], heap[largest]
			i = largest
		}
	}
	// Building the heap bottom-up is O(n), cheaper than n pushes.
	for i := len(heap)/2 - 1; i >= 0; i-- {
		siftDown(i)
	}
	for op := 0; op < k; op++ {
		// floor(p / 2) stones go; the smaller pile sinks back and may still be on top.
		heap[0] -= heap[0] / 2
		siftDown(0)
	}
	total := 0
	for _, p := range heap {
		total += p
	}
	return total
}
