import "sort"

// O(n log n + D) time - each day, attend the available event that ends soonest.
// The min-heap of end days is a plain slice with sift operations.
func maxEvents(events [][]int) int {
	sorted := append([][]int(nil), events...)
	sort.Slice(sorted, func(a, b int) bool { return sorted[a][0] < sorted[b][0] })
	heap := []int{}
	push := func(v int) {
		heap = append(heap, v)
		i := len(heap) - 1
		for i > 0 {
			parent := (i - 1) / 2
			if heap[parent] <= heap[i] {
				break
			}
			heap[parent], heap[i] = heap[i], heap[parent]
			i = parent
		}
	}
	pop := func() {
		last := len(heap) - 1
		heap[0] = heap[last]
		heap = heap[:last]
		i := 0
		for {
			smallest, left, right := i, 2*i+1, 2*i+2
			if left < len(heap) && heap[left] < heap[smallest] {
				smallest = left
			}
			if right < len(heap) && heap[right] < heap[smallest] {
				smallest = right
			}
			if smallest == i {
				return
			}
			heap[smallest], heap[i] = heap[i], heap[smallest]
			i = smallest
		}
	}
	attended, i, day := 0, 0, 0
	for i < len(sorted) || len(heap) > 0 {
		// Nothing available: jump to the next start day instead of walking empty days.
		if len(heap) == 0 && sorted[i][0] > day {
			day = sorted[i][0]
		}
		for i < len(sorted) && sorted[i][0] == day {
			push(sorted[i][1])
			i++
		}
		// Events that ended before today can no longer be attended.
		for len(heap) > 0 && heap[0] < day {
			pop()
		}
		if len(heap) > 0 {
			pop()
			attended++
		}
		day++
	}
	return attended
}
