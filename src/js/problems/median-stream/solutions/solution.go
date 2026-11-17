// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0295.Find%20Median%20from%20Data%20Stream/Solution.go
import (
	"container/heap"
	"sort"
)

// O(log n) per add, O(1) per query: a max-heap for the smaller half, a min-heap for the larger.
type MedianFinder struct {
	// container/heap is a min-heap, so the smaller half is stored negated.
	low  hp
	high hp
}

func Constructor() MedianFinder {
	return MedianFinder{hp{}, hp{}}
}

func (this *MedianFinder) AddNum(num int) {
	low, high := &this.low, &this.high
	// Route the number through the smaller half first, so the largest of it moves up and the
	// halves stay ordered whatever value arrives.
	heap.Push(low, -num)
	heap.Push(high, -heap.Pop(low).(int))
	// Keep the smaller half the same size or one larger, so its top is the odd-count median.
	if high.Len() > low.Len() {
		heap.Push(low, -heap.Pop(high).(int))
	}
}

func (this *MedianFinder) FindMedian() int64 {
	if this.low.Len() > this.high.Len() {
		return int64(-2 * this.low.IntSlice[0])
	}
	return int64(this.high.IntSlice[0] - this.low.IntSlice[0])
}

type hp struct{ sort.IntSlice }

func (h *hp) Push(v any) { h.IntSlice = append(h.IntSlice, v.(int)) }
func (h *hp) Pop() any {
	a := h.IntSlice
	v := a[len(a)-1]
	h.IntSlice = a[:len(a)-1]
	return v
}
