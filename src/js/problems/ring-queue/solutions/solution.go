// O(1) per call: one fixed array, the index of the front item and the item count. Keeping the
// count (instead of a tail index) tells empty from full without wasting a slot.
type RingQueue struct {
	data       []int
	head, size int
}

func Constructor(capacity int) RingQueue {
	return RingQueue{data: make([]int, capacity)}
}

func (this *RingQueue) Push(value int) bool {
	if this.size == len(this.data) {
		return false
	}
	// The next free slot is `size` steps after the front, wrapping past the end of the array.
	this.data[(this.head+this.size)%len(this.data)] = value
	this.size++
	return true
}

func (this *RingQueue) Pop() bool {
	if this.size == 0 {
		return false
	}
	this.head = (this.head + 1) % len(this.data)
	this.size--
	return true
}

func (this *RingQueue) Front() int {
	if this.size == 0 {
		return -1
	}
	return this.data[this.head]
}

func (this *RingQueue) Back() int {
	if this.size == 0 {
		return -1
	}
	return this.data[(this.head+this.size-1)%len(this.data)]
}

func (this *RingQueue) IsEmpty() bool {
	return this.size == 0
}

func (this *RingQueue) IsFull() bool {
	return this.size == len(this.data)
}
