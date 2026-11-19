// O(n log n) time, O(n) space: a binary max-heap hands over the heaviest stone and accepts the
// difference. It is a plain slice with sift operations, no container/heap boilerplate needed.
func lastStoneWeight(stones []int) int {
	heap := make([]int, 0, len(stones))

	push := func(value int) {
		heap = append(heap, value)
		i := len(heap) - 1
		// Sift up while the parent is lighter.
		for i > 0 {
			parent := (i - 1) / 2
			if heap[parent] >= heap[i] {
				break
			}
			heap[parent], heap[i] = heap[i], heap[parent]
			i = parent
		}
	}

	pop := func() int {
		top := heap[0]
		last := len(heap) - 1
		heap[0] = heap[last]
		heap = heap[:last]
		i := 0
		// Sift down toward the heavier child.
		for {
			heaviest := i
			left, right := 2*i+1, 2*i+2
			if left < len(heap) && heap[left] > heap[heaviest] {
				heaviest = left
			}
			if right < len(heap) && heap[right] > heap[heaviest] {
				heaviest = right
			}
			if heaviest == i {
				break
			}
			heap[heaviest], heap[i] = heap[i], heap[heaviest]
			i = heaviest
		}
		return top
	}

	for _, w := range stones {
		push(w)
	}
	for len(heap) > 1 {
		first := pop()
		second := pop()
		// Equal stones vanish; otherwise the difference goes back into the pile.
		if first != second {
			push(first - second)
		}
	}
	if len(heap) == 0 {
		return 0
	}
	return heap[0]
}
